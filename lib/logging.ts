import { pool } from "./db";

/**
 * Per-turn conversation logging into `vc_chatbot_conversations` — the same table
 * the n8n `vc-chatbot-log-turn` workflow wrote to. Fire-and-forget: logging must
 * never block or fail the chat response.
 */

export interface TurnLog {
  sessionId: string;
  turnIndex: number;
  role: "user" | "assistant";
  content: string;
  wpUserId?: number | null;
  wpUserEmail?: string | null;
  wpDisplayName?: string | null;
  civicrmContactId?: number | null;
  toolCalls?: unknown;
  model?: string | null;
  latencyMs?: number | null;
}

export function logTurn(t: TurnLog): void {
  void pool
    .query(
      `INSERT INTO vc_chatbot_conversations
         (session_id, turn_index, role, content, wp_user_id, wp_user_email,
          wp_display_name, civicrm_contact_id, tool_calls, model, latency_ms, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())`,
      [
        t.sessionId,
        t.turnIndex,
        t.role,
        t.content,
        t.wpUserId ?? null,
        t.wpUserEmail ?? null,
        t.wpDisplayName ?? null,
        t.civicrmContactId ?? null,
        t.toolCalls != null ? JSON.stringify(t.toolCalls) : null,
        t.model ?? null,
        t.latencyMs ?? null,
      ],
    )
    .catch((err) => {
      console.error("logTurn failed (non-fatal):", err instanceof Error ? err.message : err);
    });
}
