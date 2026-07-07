# MAS VC Chatbot — Off-n8n Cutover Checklist

This app replaces the n8n implementation of the VC chatbot. Cutover is **parallel-run then swap** — the n8n stack keeps serving production until the new app is validated.

## Scope of this migration pass

**In:** the core chatbot — stream agent (system prompt + Haiku 4.5), the 5 CiviCRM tools with the redaction-based access-control layer, KB hybrid retrieval, turn logging to `vc_chatbot_conversations`, and **feedback capture** (thumbs/comment → `app/api/feedback` → `vc_chatbot_feedback`; verified live).

**Deferred fast-follow (still on n8n after this pass):** `vc-update-profile` (the self-service "Update Info" widget). Keeps working on n8n until separately ported.

## 1. Repo / org placement (Brian — org admin)

- [ ] Decide final home: transfer `github.com/briangflett/mas-vc-chatbot` to the `masadvise-ontario` org (keeps MAS structurally separate from `npaiadvisor`), or keep under the personal account. Build works either way.

## 2. Vercel project (Brian)

- [ ] Create a Vercel project for this repo (its own project, not Klaus's).
- [ ] Set env vars (see `.env.example`). Required for full function:
  - `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` — shared Azure Postgres (`klaus` DB).
  - `OPENAI_API_KEY` — embeddings.
  - `LLM_PROVIDER` + `ANTHROPIC_API_KEY` (or `openrouter` + `OPENROUTER_API_KEY`). Optional `CHAT_MODEL`.
  - **`CIVICRM_API_KEY` + `CIVICRM_SITE_KEY`** — the `X-Civi-Auth` (APIv4 user key) and `X-Civi-Key` (site key) values from the n8n **"CiviCRM Custom Auth"** credential (`WIv1YM35QT3gS3E9`). ⚠️ Without these, the KB works but the 5 CiviCRM tools return an auth error. This is the one secret not already in `.env.local`.
  - `ALLOWED_ORIGIN=https://www.masadvise.org`.
- [ ] Confirm Azure Postgres firewall allows Vercel egress (Klaus already added `AllowVercel` 0.0.0.0/0 — the shared instance is reachable).

## 3. Parallel-run validation (before touching the live widget)

- [ ] Deploy to the Vercel preview/prod URL.
- [ ] KB: `node --env-file=.env.local --import tsx scripts/verify-kb.ts "…"` (already green locally).
- [ ] CiviCRM tools: on the deployed URL, open `/?email=<a-known-VC-email>` and ask "show my cases", "find [contact]", "who works at [org]". Confirm results match the n8n bot, and that **PII redaction** matches — a VC should see emails only for their own clients / consented VCs.
- [ ] Access-control spot check: log in as VC A, confirm you cannot see VC B's clients' contact details.
- [ ] Suggestion chips render (the `<<…>>` trailer is parsed).

## 4. Swap the production widget (Brian)

- [ ] Set `APP_URL` in `widgets/vcportal-chat-embed-v2.html` to the deployed origin.
- [ ] Replace the old `@n8n/chat` embed on masadvise.org/vcportal (Elementor HTML widget) with `vcportal-chat-embed-v2.html`.
- [ ] Verify identity handshake: the WP page's logged-in VC gets `[Logged-in VC: Contact ID …]` (visible in the app header showing their name).
- **Rollback:** re-point the Elementor widget back to the old n8n embed. The n8n workflows are untouched until step 5.

## 5. Retire n8n (only after validation holds)

- [ ] Disable the n8n workflows listed in `CLAUDE.md` (§ "The n8n workflows").
- [ ] Leave `vc-update-profile` **active** until its fast-follow ships (`vc-chatbot-feedback` can be disabled — feedback is now captured in-code).
- [ ] Note in Klaus memory `project_klaus_off_n8n` that the mas-vc-chatbot sibling migration (handoff #634) is complete for the core.

## Notes

- The old `@n8n/chat` widget spoke n8n's protocol; the new app speaks the Vercel AI SDK UI-message stream, which is why the embed is an iframe of the app rather than a re-pointed `createChat`.
- Identity trust model is unchanged from n8n: the widget passes `wp_user` identity, resolved from the VC's authenticated WordPress session. Hardening (a WP-signed token so the endpoint can't be called with a forged identity) is a documented follow-up, not a regression from n8n.
