import { Pool } from "pg";

/**
 * Shared Postgres pool for the MAS VC Chatbot.
 *
 * Connects to the SAME Azure Database for PostgreSQL Flexible Server that Klaus
 * and the KB pipeline use (db `klaus`). We only ever READ the shared MAS tables
 * (`kb_documents`, `kb_chunks`, `kb_document_kbs`) and WRITE our own
 * (`vc_chatbot_conversations`, `vc_chatbot_feedback`).
 *
 * Azure requires SSL; `PGSSLMODE=require` is set in the environment. We pass
 * `ssl: { rejectUnauthorized: false }` because Azure's chain isn't in the
 * default CA bundle — the connection is still encrypted.
 *
 * On Vercel serverless, module scope is reused across warm invocations, so a
 * module-level singleton pool is the right shape (a small pool, since each
 * lambda handles one request at a time).
 */

declare global {
  // eslint-disable-next-line no-var
  var _vcChatbotPgPool: Pool | undefined;
}

function makePool(): Pool {
  return new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export const pool: Pool = global._vcChatbotPgPool ?? makePool();
if (process.env.NODE_ENV !== "production") global._vcChatbotPgPool = pool;

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}
