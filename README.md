# MAS VC Chatbot

AI chatbot for MAS (Management Advisory Service) Volunteer Coordinators (~30 active on the VC Portal). Searches CiviCRM contacts/cases and queries a MAS knowledge base.

**Migrated off n8n** to a code-first Next.js app (this repo). The n8n implementation stays live until parallel-run validation completes — see [`docs/CUTOVER.md`](docs/CUTOVER.md).

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
- [`docs/CUTOVER.md`](docs/CUTOVER.md) — off-n8n deploy + cutover checklist
- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — original design spec (n8n-era; historical)
- BrianPKM `4-Archive/mas-vc-chatbot-decisions.md` — ADRs (ADR-012 = off-n8n)

## The n8n implementation (being retired)

Workflows on [n8n.masadvise.org](https://n8n.masadvise.org): `vc-chatbot-stream`, `vc-chatbot-civicrm-sub`, `kb-retrieval-sub`, `vc-chatbot-feedback`, `vc-chatbot-log-turn`, `vc-update-profile`. Feedback capture and the profile self-service flow are deferred fast-follows (still on n8n after this pass).
