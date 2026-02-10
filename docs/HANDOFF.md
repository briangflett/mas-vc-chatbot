# HANDOFF.md - Cross-Environment Context Bridge

This file bridges context between claude.ai web (Klaus) and Claude Code.
**Every session should end by updating this file.**

---

## Last Update
- **Updated by**: claude.ai web (Klaus)
- **Date**: 2026-02-10
- **Session summary**: Strategic planning session — defined project workflow between claude.ai and Claude Code, assessed current state, ready to start Phase 2.

## Current State

### What's Working
- Phase 1 UI complete: chat interface, message persistence, SSE client (mock mode), route structure
- 4 shadcn/ui components, Tailwind theming
- Database schema: User, Chat, Message tables with Drizzle ORM
- Mock streaming functional at localhost:3003
- CiviCRM tool handler workflow exists in n8n (civicrm-tool-handler.json)

### What's Not Working / Not Built
- n8n streaming orchestration workflow (vc-chatbot-stream.json) — not started
- Knowledge base retrieval workflow (vc-chatbot-knowledge.json) — not started
- Auth — hardcoded userId = 'temp-user-id'
- UI is in mock mode — not connected to real n8n backend

### What's In Progress
- Nothing half-done. Clean handoff point.

## Decisions Made (not yet in code)

- **Architecture**: Next.js handles ONLY UI. ALL business logic (AI, tools, knowledge) lives in n8n workflows. This keeps Next.js simple and allows non-developers to maintain n8n.
- **Streaming**: SSE from n8n to Next.js. Mock client exists, real client ready to toggle.
- **CiviCRM tools**: 4 tools (search_contacts, get_contact, search_cases, get_case) — reusable for future MCP server.
- **Knowledge base MVP**: Google Docs API retrieval (not vector search). Keep it simple for Phase 1.
- **Package manager**: npm (not pnpm) for this project.

## Strategic Context

This project is one of two MAS consulting engagements being used to:
1. Deliver real value to MAS volunteer consultants
2. Build case studies for convincing other Canadian nonprofits to adopt AI
3. Demonstrate the "AI as knowledge retrieval assistant" pattern

The flywheel: deliver great projects → extract case studies → create demand → land more engagements.

## Next Actions

1. **Build vc-chatbot-stream.json** — Main n8n orchestration workflow (Claude API + tool routing + SSE streaming) → **claude.ai web + n8n UI**
2. **Build vc-chatbot-knowledge.json** — Knowledge base retrieval from Google Docs → **claude.ai web + n8n UI**
3. **Configure CiviCRM credentials** in n8n for the tool handler → **n8n UI**
4. **Switch UI from mock to real n8n** — Toggle in chat-interface.tsx → **Claude Code**
5. **End-to-end testing** → **Claude Code + n8n UI**

## Blockers / Questions for Brian

- What Google Docs should the knowledge base index? Need a list of VC-relevant documents.
- CiviCRM credentials: are they already configured in n8n or do they need setup?
- Any changes to the 4 CiviCRM tools since the initial design?

## Environment Notes for Claude Code

- Dev server: `npm run dev` (port 3003, auto-starts dev-postgres)
- n8n instance: https://n8n.masadvise.org
- n8n workflow files: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`
- n8n shared docs: `/home/brian/workspace/workflows/docs/`

## Context Files Changed This Session

- Created: `docs/HANDOFF.md` (this file)
- Updated: `CLAUDE.md` (via Claude Code — added Context Bridge, updated status)

---

*Maintained by Klaus (claude.ai) and Claude Code. The baton in the relay race.*