/**
 * Query embeddings via OpenAI `text-embedding-3-small` (1536 dims).
 *
 * This MUST match the model used to ingest the KB (`scripts/ingest-kb.ts` and
 * the original Python ingester), or cosine distances are meaningless. The
 * ingested `kb_chunks.embedding` vectors were produced with this exact model.
 *
 * We call the REST endpoint directly (no SDK dependency) — the request shape is
 * stable and this keeps the bundle small, matching the original ingestion path.
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 1536;

export async function embedQuery(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  const embedding = json.data?.[0]?.embedding;
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Unexpected embedding shape (len=${embedding?.length})`);
  }
  return embedding;
}

/** pgvector literal form: "[0.1,0.2,...]" — used in `$1::vector` bindings. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
