import { pool } from "@/lib/db";
import type { VcMetadata } from "@/lib/identity";

// Feedback capture — replaces the n8n `vc-chatbot-feedback` webhook. Writes to
// the same `vc_chatbot_feedback` table (the dashboard's addressed_at/
// addressed_note triage columns keep working). Called cross-origin from the WP
// widget, so it carries the same CORS handling as the chat route.
export const runtime = "nodejs";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "https://www.masadvise.org";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

interface FeedbackRequest {
  session_id?: string;
  message_index?: number;
  user_message?: string;
  bot_response_preview?: string;
  rating?: "up" | "down" | null;
  comment?: string | null;
  metadata?: VcMetadata;
}

export async function POST(req: Request): Promise<Response> {
  let body: FeedbackRequest;
  try {
    body = (await req.json()) as FeedbackRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders() });
  }

  const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
  const md = body.metadata ?? {};

  try {
    await pool.query(
      `INSERT INTO vc_chatbot_feedback
         (session_id, message_index, user_message, bot_response_preview, rating,
          comment, wp_user, wp_user_id, wp_display_name, civicrm_contact_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())`,
      [
        body.session_id ?? "anonymous",
        body.message_index ?? null,
        body.user_message ?? null,
        (body.bot_response_preview ?? "").slice(0, 500),
        rating,
        body.comment ?? null,
        md.wp_user_email ?? null, // legacy `wp_user` column holds the email
        md.wp_user_id ?? null,
        md.wp_display_name ?? null,
        md.civicrm_contact_id ?? null,
      ],
    );
  } catch (err) {
    console.error("feedback insert failed:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}
