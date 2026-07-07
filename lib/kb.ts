import { query } from "./db";
import { embedQuery, toVectorLiteral } from "./embeddings";

/**
 * Knowledge-base retrieval — hybrid vector + full-text (BM25-style) search fused
 * with Reciprocal Rank Fusion, ported from the live n8n `kb-retrieval-sub`
 * (ID eLwfr4GbXtM1gCmJ). Queries the shared MAS pool tables `kb_chunks` /
 * `kb_documents`, scoped to a KB via `kb_ids @> ARRAY[kb_id]`.
 *
 * The n8n version string-interpolated the embedding and query text into the SQL;
 * here they are bound parameters ($1 embedding, $2 kb_id, $3 query text).
 */

const RRF_K = 60;
const TOP_K = 8;
const CANDIDATES = 20;

interface KbRow {
  chunk_id: number;
  chunk_text: string;
  rrf_score: number;
  importance: number | null;
  similarity: number | null;
  title: string | null;
  source_type: string | null;
  source_url: string | null;
  category: string | null;
}

/**
 * Access filter clause, mirroring the live workflow:
 *   access_override === 'public'  → only public chunks
 *   kb_id === 'mas_public'        → exclude internal chunks
 *   kb_id === 'mas_vc' (default)  → no access filter (VCs see everything in-KB)
 */
function accessFilter(kbId: string, accessOverride: string): string {
  if (accessOverride === "public") return "AND c.access_level = 'public'";
  if (kbId === "mas_public") return "AND c.access_level != 'internal'";
  return "";
}

export async function searchKnowledgeBase(
  queryText: string,
  kbId = "mas_vc",
  accessOverride = "",
): Promise<string> {
  const embedding = toVectorLiteral(await embedQuery(queryText));
  const filter = accessFilter(kbId, accessOverride);

  const sql = `
    WITH vector_results AS (
      SELECT c.id, c.document_id, c.chunk_text, c.importance,
             1 - (c.embedding <=> $1::vector) AS similarity,
             ROW_NUMBER() OVER (ORDER BY c.embedding <=> $1::vector) AS rank_v
      FROM kb_chunks c
      WHERE c.kb_ids @> ARRAY[$2]::text[]
      ${filter}
      ORDER BY c.embedding <=> $1::vector
      LIMIT ${CANDIDATES}
    ),
    fts_results AS (
      SELECT c.id, c.document_id, c.chunk_text, c.importance,
             ts_rank_cd(c.chunk_tsv, plainto_tsquery('english', $3)) AS fts_rank,
             ROW_NUMBER() OVER (
               ORDER BY ts_rank_cd(c.chunk_tsv, plainto_tsquery('english', $3)) DESC
             ) AS rank_f
      FROM kb_chunks c
      WHERE c.chunk_tsv @@ plainto_tsquery('english', $3)
        AND c.kb_ids @> ARRAY[$2]::text[]
        ${filter}
      ORDER BY fts_rank DESC
      LIMIT ${CANDIDATES}
    ),
    fused AS (
      SELECT
        COALESCE(v.id, f.id) AS chunk_id,
        COALESCE(v.document_id, f.document_id) AS document_id,
        COALESCE(v.chunk_text, f.chunk_text) AS chunk_text,
        COALESCE(v.importance, f.importance) AS importance,
        COALESCE(1.0 / (${RRF_K} + v.rank_v), 0) + COALESCE(1.0 / (${RRF_K} + f.rank_f), 0) AS rrf_score,
        v.similarity
      FROM vector_results v
      FULL OUTER JOIN fts_results f ON v.id = f.id
    )
    SELECT f.chunk_id, f.chunk_text, f.rrf_score, f.importance, f.similarity,
           d.title, d.source_type, d.source_url, d.category
    FROM fused f
    JOIN kb_documents d ON d.id = f.document_id
    ORDER BY f.importance DESC NULLS LAST, f.rrf_score DESC
    LIMIT ${TOP_K}
  `;

  const rows = await query<KbRow>(sql, [embedding, kbId, queryText]);
  return formatResults(rows);
}

/** Format retrieved chunks into the string the agent consumes (matches n8n). */
function formatResults(rows: KbRow[]): string {
  const usable = rows.filter((r) => r.title);
  if (usable.length === 0) {
    return "No relevant knowledge base articles found for this query.";
  }

  return usable
    .map((r) => {
      const relevance =
        r.similarity != null ? `${(r.similarity * 100).toFixed(1)}%` : "keyword match";
      const sourceLine =
        `Source: ${r.source_type ?? "unknown"} | Category: ${r.category ?? "n/a"}` +
        (r.source_url ? ` | ${r.source_url}` : "");
      return `## ${r.title}\n${sourceLine}\nRelevance: ${relevance} | Importance: ${r.importance ?? "n/a"}/5\n\n${r.chunk_text}\n\n---\n`;
    })
    .join("\n");
}
