# MAS VC Chatbot — Off-n8n Cutover Record

> **Completed. This is a record, not a live checklist.** The n8n workflows were unpublished
> 2026-07-07 and this app is the only live path. The unticked boxes below are preserved as the
> plan that was followed, not as outstanding work — do not read them as a to-do list.
>
> Two classes of item are worth distinguishing if you are auditing this:
> **repo-verifiable** — the code is off n8n (every `n8n` string in `app/`, `lib/`, `widgets/`,
> `scripts/` is a provenance comment; the update widget posts to
> `https://mas-vc-chatbot.vercel.app/api/profile`), confirmed 2026-09-06.
> **Not verifiable from the repo** — whether the Elementor blocks on masadvise.org were actually
> swapped (steps 4/4b). Those live in WordPress. The repo can only show that the widget files
> were updated to point at the app.
>
> Kept because the env-var list (§2) and the rollback notes are still the reference for
> redeploying, and because the identity trust-model note at the bottom is a live follow-up.

This app replaces the n8n implementation of the VC chatbot. The cutover strategy was
**parallel-run then swap** — the n8n stack kept serving production until the new app was validated.

## Scope of this migration pass

**In:** the core chatbot — stream agent (system prompt + Haiku 4.5), the 5 CiviCRM tools with the redaction-based access-control layer, KB hybrid retrieval, turn logging to `vc_chatbot_conversations`, and **feedback capture** (thumbs/comment → `app/api/feedback` → `vc_chatbot_feedback`; verified live).

**Also ported:** `vc-update-profile` (the self-service "Update Info" widget) → `app/api/profile` (`resolve`/`get`/`save` ops, 1:1 from the n8n Code nodes). All three verified against live CiviCRM, incl. an idempotent `save` round-trip. *(At the time of writing, the widget still pointed at the old webhook pending the Elementor Block-2 swap in step 4b. `widgets/vcportal-update-widget.html` now points at `/api/profile`.)*

## 1. Repo / org placement (Brian — org admin) — done

- [x] Decide final home. **Transferred to `masadvise-ontario/mas-vc-chatbot`**, keeping MAS structurally separate from `npaiadvisor`. Confirmed via the GitHub API 2026-09-06: `briangflett/mas-vc-chatbot` now redirects to the org repo (same repo id).
- Note for anyone with an older clone: `git remote -v` may still show the pre-transfer
  `briangflett/...` URL. It works by redirect, but `gh` resolves the base repo from the redirect
  target while taking the head owner from the URL as written, which makes `gh pr create` fail with
  *"No commits between masadvise-ontario:main and briangflett:<branch>"*. Fix with:
  `git remote set-url origin https://github.com/masadvise-ontario/mas-vc-chatbot.git`

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

## 4b. Swap the "Update your info" widget (Brian)

- [ ] Replace the Elementor Block-2 HTML with the updated `widgets/vcportal-update-widget.html` (its `WEBHOOK` now points at `https://mas-vc-chatbot.vercel.app/api/profile`).
- [ ] Open the modal as a logged-in VC: confirm it loads current values (`get`), then Save and confirm "Saved. Thanks!" (`save`). If the VC has no cached `civicrm_contact_id`, the `resolve` op runs first.
- **Rollback:** revert Block-2 to the n8n webhook URL. `vc-update-profile` stays active until step 5.

## 5. Retire n8n (only after validation holds) — done 2026-07-07

- [ ] Disable the n8n workflows listed in `CLAUDE.md` (§ "The n8n workflows").
- [ ] `vc-update-profile` can be disabled once Block-2 (step 4b) is swapped and verified. `vc-chatbot-feedback` can be disabled now — feedback is captured in-code.
- [ ] Note in Klaus memory `project_klaus_off_n8n` that the mas-vc-chatbot sibling migration (handoff #634) is complete for the core.

## Notes

- The old `@n8n/chat` widget spoke n8n's protocol; the new app speaks the Vercel AI SDK UI-message stream, which is why the embed is an iframe of the app rather than a re-pointed `createChat`.
- Identity trust model is unchanged from n8n: the widget passes `wp_user` identity, resolved from the VC's authenticated WordPress session. Hardening (a WP-signed token so the endpoint can't be called with a forged identity) is a documented follow-up, not a regression from n8n.
