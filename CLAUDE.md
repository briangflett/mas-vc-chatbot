# MAS VC Chatbot - Claude Guide

## ⚠️ CRITICAL

**Security**: NO secrets in git. Check before every commit.
**Tools**: Use web interface (not Android app) for n8n MCP tools and GitHub access.

---

## Project Overview

**Purpose**: AI chatbot for MAS volunteer consultants
**Status**: Phase 1 MVP Development
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

**Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Drizzle ORM
**Backend**: n8n at https://n8n.masadvise.org
**AI**: Claude API (Anthropic) - called from n8n
**Database**: Postgres (dev: Docker `dev-postgres`, prod: Vercel)
**Package Manager**: npm (not pnpm!)

```bash
npm run dev -p 3003  # Start dev server (port 3003)
npm run db:migrate   # Run migrations
npm run db:studio    # Database GUI
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

**This Repo** (Next.js UI):
- `README.md`, `package.json`, `.env.local`
- Project plan: `/mnt/c/Documents and Settings/brian/Downloads/VC_CHATBOT_PROJECT (1).md`

**n8n Workflows** (Business Logic):
- **Location**: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`
- **Workflows**: `civicrm-tool-handler.json`, future streaming workflows
- **Documentation**: Detailed n8n implementation docs, CiviCRM API v4 reference, testing procedures

**Reference**: `/home/brian/workspace/development/mas-ai-chatbot/` (similar patterns)

**n8n Guidance** (Shared): `/home/brian/workspace/workflows/docs/`
- `N8N_AI_GUIDANCE.md` - MCP tools
- `WORKFLOW_PATTERNS.md` - Common patterns
- `N8N_BEST_PRACTICES.md` - Standards
- `API_AUTHENTICATION.md` - HTTP auth best practices

---

## Environment

```bash
# .env.local
POSTGRES_URL=postgresql://username:password@localhost:5432/vc_chatbot
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.masadvise.org/webhook/vc-chat-stream
NEXT_PUBLIC_N8N_WEBHOOK_TOKEN=your-token-here
```

**Database setup**:
```bash
docker exec dev-postgres psql -U brian -d n8n -c "CREATE DATABASE vc_chatbot;"
```

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

**Detailed n8n Documentation**: See `/home/brian/workspace/workflows/personal/mas-vc-chatbot/` for:
- CiviCRM API v4 authentication patterns
- RelationshipCache join patterns
- Testing procedures and troubleshooting
- Import instructions

---

## Phase 1 MVP Checklist

**Week 1** (Next.js - CLI):
- [ ] Chat interface components
- [ ] SSE streaming client
- [ ] Database tables/migrations

**Week 2** (n8n - Web):
- [ ] Design workflows with MCP tools
- [ ] Validate and test

**Week 3** (Integration - Both):
- [ ] Connect UI to n8n
- [ ] Test end-to-end
- [ ] Polish and deploy

---

**Last Updated**: 2026-01-22