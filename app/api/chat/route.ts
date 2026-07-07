import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
  type ModelMessage,
} from "ai";
import { getChatModel, MAX_OUTPUT_TOKENS, MAX_STEPS } from "@/lib/model";
import { SYSTEM_PROMPT, identitySuffix } from "@/lib/prompt";
import { resolveVcIdentity, type VcMetadata } from "@/lib/identity";
import { getAuthContext } from "@/lib/civicrm";
import { buildTools } from "@/lib/tools";
import { logTurn } from "@/lib/logging";

// The chat endpoint is called cross-origin from the WordPress site. Run on the
// Node.js runtime (pg + the OpenAI/CiviCRM fetches need it) and allow long
// tool-loop turns.
export const runtime = "nodejs";
export const maxDuration = 60;

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

interface ChatRequest {
  messages: UIMessage[];
  metadata?: VcMetadata;
  sessionId?: string;
}

/** Append the `[Logged-in VC: ...]` suffix to the final user turn (matches n8n). */
function injectIdentity(messages: ModelMessage[], suffix: string): ModelMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (typeof m.content === "string") {
      m.content = m.content + suffix;
    } else if (Array.isArray(m.content)) {
      const lastText = [...m.content].reverse().find((p) => p.type === "text");
      if (lastText && lastText.type === "text") lastText.text += suffix;
    }
    break;
  }
  return messages;
}

export async function POST(req: Request): Promise<Response> {
  const started = Date.now();
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON body", { status: 400, headers: corsHeaders() });
  }

  const md = body.metadata ?? {};
  const sessionId = body.sessionId ?? "anonymous";

  // 1. Resolve the VC's CiviCRM identity (fast path or email lookup).
  const identity = await resolveVcIdentity(md);

  // 2. Resolve their access scope for redaction, then build the tools.
  const auth = await getAuthContext(identity.civicrmContactId);
  const tools = buildTools(auth);

  // 3. Convert UI messages → model messages and inject the identity suffix.
  const modelMessages = injectIdentity(
    convertToModelMessages(body.messages),
    identitySuffix(identity),
  );

  // Log the latest user turn (fire-and-forget).
  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  if (lastUser) {
    logTurn({
      sessionId,
      turnIndex: body.messages.length,
      role: "user",
      content: uiText(lastUser),
      wpUserId: md.wp_user_id ?? null,
      wpUserEmail: md.wp_user_email ?? null,
      wpDisplayName: md.wp_display_name ?? null,
      civicrmContactId: identity.civicrmContactId,
    });
  }

  const modelId = process.env.CHAT_MODEL ?? "claude-haiku-4-5";

  const result = streamText({
    model: getChatModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    onFinish: ({ text, toolCalls }) => {
      logTurn({
        sessionId,
        turnIndex: body.messages.length + 1,
        role: "assistant",
        content: text,
        wpUserId: md.wp_user_id ?? null,
        wpUserEmail: md.wp_user_email ?? null,
        wpDisplayName: md.wp_display_name ?? null,
        civicrmContactId: identity.civicrmContactId,
        toolCalls: toolCalls?.length ? toolCalls : null,
        model: modelId,
        latencyMs: Date.now() - started,
      });
    },
  });

  return result.toUIMessageStreamResponse({ headers: corsHeaders() });
}

/** Flatten a UIMessage's text parts for logging. */
function uiText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
