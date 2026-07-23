# MAS VC Chatbot — Claude Guide

@/home/brian/workspace/claude/context/mas-claude-context/claude-code/global/protocols/security-preamble.md

---

@/home/brian/workspace/claude/context/mas-claude-context/claude-code/global/protocols/session-lifecycle.md

**Project-specific context** (read at session start):
1. `docs/PROJECT_SPEC.md` — original design spec (n8n-era; historical)
2. `docs/CUTOVER.md` — the off-n8n cutover checklist (current)
3. BrianPKM `4-Archive/mas-vc-chatbot-decisions.md` — ADRs (ADR-012 = off-n8n)

---

## Project Overview

**Purpose**: AI chatbot for MAS Volunteer Coordinators (~30 active on the VC Portal) to search CiviCRM contacts/cases and query a MAS knowledge base.
**Status**: **Migrated off n8n → code-first Next.js app** (this repo). Cutover complete — the n8n workflows were unpublished 2026-07-07; this app is the only live path.
**Deployment**: Standalone Next.js app on Vercel; embedded on masadvise.org/vcportal via an iframe (`widgets/vcportal-chat-embed-v2.html`).

---

## Architecture (code-first)

```
WordPress (masadvise.org/vcportal)
  └─ iframe embed (widgets/vcportal-chat-embed-v2.html) — posts wp_user identity
       └─ Next.js app (this repo, Vercel)
            ├─ app/page.tsx           chat UI (Vercel AI SDK useChat, streaming, <<suggestion>> chips)
            └─ app/api/chat/route.ts  agent endpoint (CORS, identity resolve, tool loop, turn logging)
                 └─ lib/
                    ├─ model.ts       provider selector (Anthropic | OpenRouter), Haiku 4.5 default
                    ├─ prompt.ts      verbatim system prompt (ported from live n8n agent)
                    ├─ identity.ts    resolve VC CiviCRM contact ID (fast path / email lookup)
                    ├─ civicrm.ts     API4 client + redaction-based access control
                    ├─ tools.ts       5 CiviCRM tools + search_knowledge_base
                    ├─ kb.ts          hybrid vector+BM25 (RRF) retrieval over kb_chunks/kb_documents
                    ├─ embeddings.ts  OpenAI text-embedding-3-small
                    ├─ db.ts          pg pool → shared Azure Postgres (db `klaus`)
                    └─ logging.ts     turn logging → vc_chatbot_conversations
```

**Shared Azure Postgres** (`mas-n8n-postgress-db…`, db `klaus`) — same instance as Klaus. We READ the KB pool tables (`kb_chunks`, `kb_documents`, `kb_document_kbs`; KB scope `kb_id='mas_vc'`, 446 chunks) and WRITE our own (`vc_chatbot_conversations`, `vc_chatbot_feedback`). Never mutate KB tables.

### Access control (redaction, not query restriction)

CiviCRM queries run **unrestricted** (`checkPermissions:false` — trusted service account). `lib/civicrm.ts:getAuthContext()` resolves the VC's authorised contact/org IDs (clients on their own cases via the `"Case Coordinator is"` relation, plus those orgs and client reps); the per-tool redactors in `lib/tools.ts` NULL email/phone on out-of-scope rows. VC emails additionally pass through on consent (`MAS_Rep.Share_Email_with_VC_s`).

> **⚠️ Divergence watch — CiviCRM client is duplicated.** The `civiApi4()` transport in `lib/civicrm.ts` is mirrored by the sibling **`mas-civicrm-mcp-server/src/civicrm/client.ts`** (internal MAS Operations Assistant). Both hit the same live CiviCRM with the same wire protocol (endpoint, `X-Civi-Auth`/`X-Civi-Key` headers, form-urlencoded `params`, site-root `CIVICRM_BASE_URL`, `CiviError` handling). This copy is the deployed/battle-tested one — when you change the transport or auth here, check the MCP server for drift (its `CLAUDE.md` → "Divergence watch"). The redaction/access-control layer above is intentionally **not** shared (the MCP server's consumer is trusted, so it has none).

---

## Conventions

- Chat model: **Haiku 4.5** by default (`CHAT_MODEL`), matching the live n8n stream. Provider via `LLM_PROVIDER` (`anthropic` default, `openrouter` alt).
- Dev server: `pnpm dev` on port 3005.
- SQL bindings are parameterized (the n8n KB sub string-interpolated; the port does not).
- Pure logic (`lib/suggestions.ts`, `lib/prompt.ts`, redaction predicates) is unit-tested (`tests/unit.test.ts`).

```bash
pnpm dev            # local (http://localhost:3005)
pnpm build          # production build (runs the real typecheck)
pnpm lint           # tsc --noEmit
pnpm test           # vitest
node --env-file=.env.local --import tsx scripts/verify-kb.ts "question"   # KB smoke test
```

### Environment

See `.env.example` (authoritative). Deploy prereqs for cutover live in `docs/CUTOVER.md` — notably the CiviCRM service-account keys (`CIVICRM_API_KEY` / `CIVICRM_SITE_KEY`) that came from the n8n "CiviCRM Custom Auth" credential.

---

## The n8n workflows (retired)

Unpublished at the 2026-07-07 cutover (historical IDs kept for archive reference):
`vc-chatbot-stream` (O0phZvFcYNr7BGis), `vc-chatbot-civicrm-sub` (nmVIws1rIVYhpgMi), `kb-retrieval-sub` (eLwfr4GbXtM1gCmJ), `vc-chatbot-feedback` (qEpr6ozyCjZyi57Y), `vc-chatbot-log-turn` (DeJuZrPKFwIHBEey), `vc-update-profile` (5OarmqbQLcSJa6zU), plus eval scaffolds. Feedback capture is in-code (`app/api/feedback` → `vc_chatbot_feedback`). The **vc-update-profile self-service flow is the one remaining deferred fast-follow** — it needs a code-first replacement, not an n8n revival.

---

**Last Updated**: 2026-07-09
