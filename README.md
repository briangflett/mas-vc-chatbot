# MAS VC Chatbot

AI chatbot for MAS (Management Advisory Service) Volunteer Coordinators (~30 active on the VC Portal). Searches CiviCRM contacts/cases and queries a MAS knowledge base.

**Migrated off n8n** to a code-first Next.js app (this repo). **Cutover is complete** — the n8n workflows were unpublished 2026-07-07 and this app is the only live path. [`docs/CUTOVER.md`](docs/CUTOVER.md) is kept as the record of how it was done.

## Architecture

```
WordPress (masadvise.org/vcportal)
  └─ iframe embed (widgets/vcportal-chat-embed-v2.html) — posts wp_user identity
       └─ Next.js app on Vercel
            ├─ app/page.tsx           chat UI (Vercel AI SDK useChat, streaming)
            └─ app/api/chat/route.ts  agent endpoint → lib/ (model · prompt · identity ·
                                      civicrm · tools · kb · embeddings · db · logging)
```

- **Model**: Claude Haiku 4.5 (default), via the Vercel AI SDK. Provider selectable (`LLM_PROVIDER=anthropic|openrouter`).
- **CiviCRM**: API4 with redaction-based access control (queries run unrestricted; PII is nulled on rows outside the VC's authorised scope).
- **Knowledge base**: hybrid vector + BM25 retrieval (RRF) over `kb_chunks`/`kb_documents` on the shared Azure Postgres, KB scope `mas_vc`.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3005
pnpm build          # production build (real typecheck)
pnpm lint           # tsc --noEmit
pnpm test           # vitest
node --env-file=.env.local --import tsx scripts/verify-kb.ts "How do I close a project?"
```

See [`.env.example`](.env.example) for configuration.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — architecture + conventions for Claude Code
- [`docs/CUTOVER.md`](docs/CUTOVER.md) — the off-n8n cutover record (completed; kept for the rollback and env-var detail)
- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — original design spec (n8n-era; historical)
- BrianPKM `4-Archive/mas-vc-chatbot-decisions.md` — ADRs (ADR-012 = off-n8n)

## The n8n implementation (retired)

**Nothing in this repo calls n8n at runtime.** Every remaining `n8n` string in `app/`, `lib/`,
`widgets/` and `scripts/` is a provenance comment naming the workflow a file was ported from.

The workflows — `vc-chatbot-stream`, `vc-chatbot-civicrm-sub`, `kb-retrieval-sub`,
`vc-chatbot-feedback`, `vc-chatbot-log-turn`, `vc-update-profile` — were unpublished on
n8n.masadvise.org at the 2026-07-07 cutover. Historical IDs are in [`CLAUDE.md`](CLAUDE.md)
§ *The n8n workflows*.

Both flows this section used to call deferred are now in code: **feedback capture** at
`app/api/feedback` → `vc_chatbot_feedback`, and the **profile self-service flow** at
`app/api/profile` (ported in `cf5665e`).

`vc-chatbot-eval-harness.json` at the repo root is an n8n workflow export, retained as an
n8n-era artefact for reference. It is not runnable — there is no n8n to run it on.
