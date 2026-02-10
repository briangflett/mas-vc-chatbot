# MAS VC Chatbot - Claude Guide

## ⚠️ CRITICAL

**Security**: NO secrets in git. Check before every commit.
**Tools**: Use web interface (not Android app) for n8n MCP tools and GitHub access.

---

## Context Bridge
**Before starting work**: Read `docs/HANDOFF.md` for current state.
**Before ending session**: Update `docs/HANDOFF.md` with what changed.

---

## Project Overview

**Purpose**: AI chatbot for MAS volunteer consultants
**Status**: Phase 1 UI Complete - Ready for Phase 2 (n8n workflows)
**Working Directory**: `/home/brian/workspace/development/mas-vc-chatbot`

---

## Architecture (Know This!)

```
Next.js (UI only)           n8n (All business logic)
- Chat interface     ←SSE→  - Claude API calls
- Message storage           - CiviCRM tools (4 tools)
- Auth integration          - Knowledge retrieval
                            - Streaming orchestration
```

**Technology Split**:
- **Next.js**: UI, SSE client, Postgres storage, auth
- **n8n**: AI orchestration, tools, prompts, streaming

**Why?** n8n provides visual workflow design; same tools work in future MCP server.

---

## Tech Stack

**Frontend**: Next.js 16.1.3, React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/ui
**ORM**: Drizzle ORM 0.45.1 with Drizzle Kit 0.31.8
**Backend**: n8n at https://n8n.masadvise.org
**AI**: Claude API (Anthropic) - called from n8n
**Database**: Postgres (dev: Docker `dev-postgres`, prod: Vercel)
**Other**: Framer Motion 12.26, Zod 4.3, date-fns 4.1, nanoid 5.1, sonner 2.0
**Package Manager**: npm (not pnpm!)

```bash
npm run dev          # Start dev server (port 3003, auto-starts dev-postgres)
npm run build        # Build (runs db:migrate first)
npm run db:migrate   # Run migrations
npm run db:generate  # Generate migrations from schema
npm run db:studio    # Database GUI
npm run db:push      # Push schema changes directly
```

---

## Tool Selection

**Web Interface** (claude.ai browser):
- Use n8n MCP tools: `n8n-mcp:n8n_list_workflows`, `n8n_get_workflow`, `n8n_create_workflow`, etc.
- Read GitHub files: `web_fetch: https://raw.githubusercontent.com/...`
- Design workflows, validate, test

**Claude Code CLI**:
- Implement Next.js UI components
- Database migrations
- Git operations
- Testing

**n8n Web UI** (https://n8n.masadvise.org):
- Visual workflow design
- Credential management
- Execution debugging

---

## Key Files

**Routes & Pages**:
- `src/app/page.tsx` - Home (generates chat ID, redirects to /chat/[id])
- `src/app/(chat)/chat/[id]/page.tsx` - Chat page (renders ChatInterface)
- `src/app/(chat)/chat/[id]/actions.ts` - Server action for saveMessage
- `src/app/api/messages/route.ts` - POST endpoint for message persistence

**Components** (`src/components/chat/`):
- `chat-interface.tsx` - Main orchestration (state, streaming, DB saves)
- `message-list.tsx` - Message display with auto-scroll
- `message-input.tsx` - Input textarea (Enter to send, Shift+Enter newline)
- `message.tsx` - Individual message bubble (user right, assistant left)

**Database** (`src/lib/db/`):
- `schema.ts` - Tables: User, Chat, Message (with metadata JSON for tool calls)
- `queries.ts` - Helpers: getUserByEmail, createChat, getMessagesByChatId, createMessage
- `index.ts` - Drizzle connection setup
- `migrations/` - Generated SQL migrations

**n8n Integration** (`src/lib/n8n/`):
- `streaming-client.ts` - SSE client (mock + real n8n functions)
- `types.ts` - N8NStreamChunk, ChatMessage interfaces

**shadcn/ui** (`src/components/ui/`): button, card, input, textarea, scroll-area

**Docs** (`docs/`): SETUP_COMPLETE.md, NEXT_STEPS.md, TESTING_GUIDE.md

**n8n Workflows** (Business Logic):
- **Location**: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`
- **Workflows**: `civicrm-tool-handler.json`, future streaming workflows

**n8n Guidance** (Shared): `/home/brian/workspace/workflows/docs/`

---

## Environment

```bash
# .env.local (see .env.example for template)
POSTGRES_URL=postgresql://username:password@localhost:5432/vc_chatbot
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.masadvise.org/webhook/vc-chat-stream
NEXT_PUBLIC_N8N_WEBHOOK_TOKEN=your-token-here
```

**Database setup**:
```bash
docker exec dev-postgres psql -U brian -d n8n -c "CREATE DATABASE vc_chatbot;"
npm run db:migrate
```

---

## Current State

**Auth**: NOT implemented yet - hardcoded `userId = 'temp-user-id'`
**Streaming**: Mock mode active in chat-interface.tsx (toggle to real n8n when ready)
**UI**: Fully functional chat with mock data at http://localhost:3003

---

## CiviCRM Tools (in n8n)

1. `search_contacts` - Find contacts by name/email/org
2. `get_contact` - Get detailed contact info
3. `search_cases` - Search cases with filters
4. `get_case` - Get case details + activities

**Protocol**: `/home/brian/workspace/claude/context/mas-claude-context/claude-code/global/protocols/api4.md`

---

## n8n Workflows

**Location**: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`

**Implemented Workflows**:
1. **civicrm-tool-handler.json** - Reusable CiviCRM API v4 wrapper
   - Endpoint: `/webhook/civicrm-tools`
   - 4 core tools implemented
   - Uses CiviCRM Custom Auth credential

**Future Workflows**:
2. **vc-chatbot-stream.json** - Main chat orchestration with Claude streaming
3. **vc-chatbot-knowledge.json** - Knowledge base retrieval from Google Docs

---

## MVP Progress

**Phase 1 - Next.js UI** (COMPLETE):
- [x] Chat interface components (4 components)
- [x] SSE streaming client (mock + real)
- [x] Database schema & migrations (User, Chat, Message)
- [x] API route for message persistence
- [x] Route structure (/chat/[id])
- [x] shadcn/ui components & Tailwind theming

**Phase 2 - n8n Workflows** (TODO):
- [ ] Build vc-chatbot-stream.json (main orchestration)
- [ ] Build vc-chatbot-knowledge.json (knowledge base)
- [ ] Configure CiviCRM credentials in n8n
- [ ] Switch UI from mock to real n8n streaming

**Phase 3 - Integration & Polish** (TODO):
- [ ] User authentication
- [ ] Chat history sidebar
- [ ] End-to-end testing
- [ ] Production deployment (Vercel)

---

**Last Updated**: 2026-02-10