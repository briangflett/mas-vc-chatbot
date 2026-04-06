#!/usr/bin/env python3
"""
Ingest KB content into pgvector for the MAS VC Chatbot.
Reads markdown files from docs/kb-content/, chunks them, generates
OpenAI embeddings, and inserts into vc_knowledge_vectors table.

Usage: python3 scripts/ingest-kb.py [--clear]
  --clear: Delete existing vectors before ingesting
"""

import os
import sys
import json
import uuid
import time
import psycopg2
import requests
from dotenv import load_dotenv

load_dotenv('.env.local')

# Config
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 200
EMBEDDING_MODEL = "text-embedding-3-small"
COLLECTION_ID = "c8eb71b0-2d9e-4a88-b479-cafad74ba1f2"
KB_DIR = "docs/kb-content"

SOURCE_TYPES = {
    "pages": "website",
    "articles": "blog",
    "publications": "publication",
    "vc-support-centre": "internal_guide",
    "resource-library": "resource_library",
}


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into chunks with overlap, breaking at paragraph/sentence boundaries."""
    if not text or len(text) == 0:
        return []
    if len(text) <= chunk_size:
        return [text.strip()]

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        if end < len(text):
            # Try to break at paragraph boundary
            last_para = text.rfind('\n\n', start + int(chunk_size * 0.5), end)
            last_sentence = text.rfind('. ', start + int(chunk_size * 0.5), end)
            if last_para > 0:
                end = last_para + 2
            elif last_sentence > 0:
                end = last_sentence + 2
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = end - overlap
    return chunks


def get_embeddings(texts, api_key):
    """Get embeddings from OpenAI API. Handles batches of up to 2048 texts."""
    all_embeddings = []
    batch_size = 100  # OpenAI recommends <= 2048, but keep batches manageable

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        resp = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={"model": EMBEDDING_MODEL, "input": batch},
        )
        resp.raise_for_status()
        data = resp.json()
        embeddings = [item["embedding"] for item in data["data"]]
        all_embeddings.extend(embeddings)

        if i + batch_size < len(texts):
            print(f"    Embedded {i + len(batch)}/{len(texts)} chunks...")
            time.sleep(0.5)  # Rate limit courtesy

    return all_embeddings


def load_documents():
    """Load all markdown files from kb-content directories."""
    documents = []
    for category, source_type in SOURCE_TYPES.items():
        cat_dir = os.path.join(KB_DIR, category)
        if not os.path.isdir(cat_dir):
            continue
        for filename in sorted(os.listdir(cat_dir)):
            if not filename.endswith('.md'):
                continue
            filepath = os.path.join(cat_dir, filename)
            with open(filepath, 'r') as f:
                content = f.read()

            lines = content.split('\n')
            title = lines[0].replace('# ', '').strip() if lines[0].startswith('#') else filename.replace('.md', '')

            source_url = ""
            for line in lines[1:5]:
                if line.startswith('Source:'):
                    source_url = line.replace('Source:', '').strip()
                    break

            documents.append({
                "title": title,
                "content": content,
                "source_type": source_type,
                "source_url": source_url,
                "category": category,
            })
    return documents


def main():
    clear = "--clear" in sys.argv

    # Load env
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set")
        sys.exit(1)

    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=os.environ["PGHOST"],
        port=os.environ["PGPORT"],
        dbname=os.environ["PGDATABASE"],
        user=os.environ["PGUSER"],
        password=os.environ["PGPASSWORD"],
        sslmode=os.environ["PGSSLMODE"],
    )
    cur = conn.cursor()

    # Optionally clear existing vectors
    if clear:
        cur.execute("DELETE FROM vc_knowledge_vectors WHERE collection_id = %s", (COLLECTION_ID,))
        conn.commit()
        print(f"Cleared existing vectors for collection {COLLECTION_ID}")

    # Load documents
    documents = load_documents()
    print(f"Loaded {len(documents)} documents")

    # Chunk all documents
    all_chunks = []
    for doc in documents:
        chunks = chunk_text(doc["content"])
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "text": chunk,
                "metadata": {
                    "title": doc["title"],
                    "source_type": doc["source_type"],
                    "source_url": doc["source_url"],
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
            })
    print(f"Created {len(all_chunks)} chunks")

    # Get embeddings in batches
    print("Generating embeddings...")
    texts = [c["text"] for c in all_chunks]
    embeddings = get_embeddings(texts, api_key)
    print(f"Generated {len(embeddings)} embeddings")

    # Insert into PostgreSQL
    print("Inserting into database...")
    insert_sql = """
        INSERT INTO vc_knowledge_vectors (id, text, metadata, embedding, collection_id)
        VALUES (%s, %s, %s::jsonb, %s::vector, %s::uuid)
    """
    inserted = 0
    for chunk, embedding in zip(all_chunks, embeddings):
        embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
        cur.execute(insert_sql, (
            str(uuid.uuid4()),
            chunk["text"],
            json.dumps(chunk["metadata"]),
            embedding_str,
            COLLECTION_ID,
        ))
        inserted += 1
        if inserted % 50 == 0:
            conn.commit()
            print(f"  Inserted {inserted}/{len(all_chunks)}...")

    conn.commit()
    print(f"Done! Inserted {inserted} vectors.")

    # Verify
    cur.execute("SELECT COUNT(*) FROM vc_knowledge_vectors WHERE collection_id = %s", (COLLECTION_ID,))
    count = cur.fetchone()[0]
    print(f"Total vectors in collection: {count}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
