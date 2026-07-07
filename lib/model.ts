import { anthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

/**
 * Model-provider selector for the chat agent.
 *
 * The original n8n workflow ran on Anthropic Sonnet (`claude-sonnet-4-...`) and
 * the migration spec called for a move to OpenRouter (Steve's expense approval).
 * The Vercel AI SDK abstracts the provider, so we support both behind one env
 * var — the choice is a deploy-time decision, not a code change.
 *
 *   LLM_PROVIDER=anthropic   (default) → uses ANTHROPIC_API_KEY
 *   LLM_PROVIDER=openrouter           → uses OPENROUTER_API_KEY
 *
 * CHAT_MODEL overrides the model id. Defaults to Haiku 4.5 — the model the live
 * n8n stream actually runs (`anthropic/claude-haiku-4.5` on OpenRouter) — chosen
 * for its low cost on a high-volume tool-use + RAG chatbot. Bump to
 * `claude-sonnet-5` if answer quality needs it. For OpenRouter, set CHAT_MODEL to
 * a namespaced id (e.g. `anthropic/claude-haiku-4.5`).
 */

export function getChatModel(): LanguageModel {
  const provider = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  const modelId = process.env.CHAT_MODEL;

  if (provider === "openrouter") {
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    return openrouter.chat(modelId ?? "anthropic/claude-haiku-4.5");
  }

  return anthropic(modelId ?? "claude-haiku-4-5");
}

/** Max output tokens per turn — the original agent capped at 2048; we allow a
 *  little more headroom for cited answers. Env-overridable. */
export const MAX_OUTPUT_TOKENS = Number(process.env.CHAT_MAX_TOKENS ?? 4096);

/** Max agent tool-call iterations (the n8n AI Agent used 10). */
export const MAX_STEPS = Number(process.env.CHAT_MAX_STEPS ?? 10);
