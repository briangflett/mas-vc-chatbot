# VC Chatbot Handoff Document

> Complete design specification for the MAS Volunteer Coordinator AI Chatbot.
> Any Claude session can pick up this project from this document.

## Last Updated
- **Date**: 2026-02-11
- **Updated by**: Claude Code (CLI)
- **Session summary**: Planning session for Phase 1 KB infrastructure. Confirmed Azure PostgreSQL is ready (v14, Standard_B1ms, Canada Central). Discovered that the `n8n-mcp` MCP server (api.n8n-mcp.com) provides full workflow CRUD tools (Create, Update, Search Nodes, Validate, etc.) but requires `/mcp` re-authentication in Claude Code CLI. The `n8n` server (n8n.masadvise.org/mcp-server/http) only provides 3 tools (search, execute, get_details). Next session: use n8n-mcp tools to build Phase 1.

---

## Project Overview

**Goal:** Build an AI chatbot for MAS (Management Advisory Service) Volunteer Coordinators (VCs) that can answer questions about MAS processes, search contacts/cases in CiviCRM, and provide guidance from MAS's knowledge base.

**Target Users:** ~50 active Volunteer Coordinators who manage nonprofit consulting engagements for MAS.

**Deployment:** Embedded chat widget on masadvise.org (WordPress), powered by n8n Chat Trigger + Anthropic Claude.

---

## Current State (as of 2026-02-11)

### What's Working
- **civicrm-tool-handler** (KKik67GlUddpDQED): Built, tested, **ACTIVE**. 4 CiviCRM tools with eval framework. Still useful for direct API testing and evals.
- **vc-chatbot-civicrm-sub** (nmVIws1rIVYhpgMi): **NEW**. Sub-workflow called by AI Agent's Workflow Tools. Receives toolName + params, routes to CiviCRM API4 via HTTP Request with CiviCRM Custom Auth credential. **ACTIVE**.
- **vc-chatbot-stream** (O0phZvFcYNr7BGis): **FULLY BUILT AND DEPLOYED**. Chat Trigger + AI Agent + 4 Workflow Tools + 1 Code Tool (KB placeholder) + Memory. **ACTIVE**.
- **CiviCRM tools**: All 4 verified working end-to-end (search_contacts, get_contact, search_cases, get_case return real CiviCRM data).
- **Anthropic credential**: Confirmed — `brian.g.flett Anthropic account` (7UPj62kj2GRdAC8j)
- **Tool architecture**: 4 CiviCRM tools use Workflow Tool nodes → vc-chatbot-civicrm-sub sub-workflow → CiviCRM API4 with CiviCRM Custom Auth credential. No hardcoded tokens.

### What's Not Working / Not Built
- **vc-chatbot-knowledge** (mnodV7Z4bkPuuvGV): Skeleton only. Needs pgvector RAG implementation.
- **pgvector**: Not yet enabled on Azure PostgreSQL. Extension confirmed available on Azure Flexible Server.
- **Knowledge base ingestion**: vc-chatbot-ingest workflow not built yet.
- **Knowledge base tool**: Fails gracefully with helpful error message until vc-chatbot-knowledge is built.

### What's In Progress
- Nothing half-done. Clean handoff point between Phase 2 (complete) and Phase 1 KB infrastructure (next).

---

## Architecture

### Option A: n8n AI Agent with Chat Trigger - IMPLEMENTED

```
n8n Chat Trigger (public hosted) -> AI Agent -> [Auto Response]
                                      |
                            +-- Anthropic Claude Sonnet 4 (LLM)
                            +-- Window Buffer Memory (10 messages)
                            +-- Tool: Search Contacts (Workflow Tool -> vc-chatbot-civicrm-sub -> CiviCRM API4)
                            +-- Tool: Get Contact (Workflow Tool -> vc-chatbot-civicrm-sub -> CiviCRM API4)
                            +-- Tool: Search Cases (Workflow Tool -> vc-chatbot-civicrm-sub -> CiviCRM API4)
                            +-- Tool: Get Case (Workflow Tool -> vc-chatbot-civicrm-sub -> CiviCRM API4)
                            +-- Tool: Search Knowledge Base (Code Tool -> placeholder until KB built)
```

**Why Workflow Tools instead of Code Tools?** `httpRequestWithAuthentication()` is not supported in Code Tool nodes. Workflow Tool nodes call a sub-workflow where regular Code/HTTP Request nodes have full credential access.

**Chat widget URL**: Available at n8n Chat Trigger hosted URL when workflow is active.
**Allowed origins**: https://www.masadvise.org

### Option B: Next.js + Vercel AI SDK (Future Upgrade)

True token-by-token streaming, richer UI, full control. Upgrade path if VCs want a more polished experience.

---

## Existing n8n Workflows

### civicrm-tool-handler (ID: KKik67GlUddpDQED)

**Status:** Built, tested, **ACTIVE**. Has eval framework.
**Webhook:** POST /webhook/civicrm-tools (Header Auth: mas-vc-chatbot)
**Credential:** CiviCRM Custom Auth (ID: WIv1YM35QT3gS3E9)

**4 Tools:**

| Tool | Input | What it does |
|------|-------|-------------|
| search_contacts | search_term, filter_type (all/active_vcs/org_employees), organization_id, limit | Searches contacts via CiviCRM API4. Returns id, display_name, contact_type, email, employer. |
| get_contact | contactId | Gets full contact details including VC status, phone, sub-type. |
| search_cases | unassigned (bool), vc_contact_id, client_org_id, status, limit | Searches cases with JOINs to get client + VC coordinator info. Custom fields included. |
| get_case | caseId | Gets full case details with all custom fields, client, and VC coordinator. |

**Input format:** `{ "toolName": "search_contacts", "toolInput": { "search_term": "Smith", "filter_type": "active_vcs" } }`

**CiviCRM API4 pattern:** Code nodes build params object -> stringify -> POST to /civicrm/ajax/api4/{entity}/{action} with form-urlencoded body.

### vc-chatbot-civicrm-sub (ID: nmVIws1rIVYhpgMi)

**Status:** Built, tested, **ACTIVE**. Sub-workflow for CiviCRM tool calls.

**7 Nodes:**
- Execute Workflow Trigger (accepts: toolName, search_term, filter_type, organization_id, limit, contactId, unassigned, vc_contact_id, client_org_id, status, caseId)
- Switch: Route by Tool (4 outputs by toolName)
- 4 Code nodes: Build Search Contact Request, Build Get Contact Request, Build Search Cases Request, Build Get Case Request
- HTTP Request: CiviCRM API4 (POST, form-urlencoded, CiviCRM Custom Auth credential)

**Credential:** CiviCRM Custom Auth (ID: WIv1YM35QT3gS3E9)
**Called by:** vc-chatbot-stream Workflow Tool nodes

### vc-chatbot-stream (ID: O0phZvFcYNr7BGis)

**Status:** FULLY BUILT AND DEPLOYED. Active.

**9 Nodes:**
- Chat Trigger (public hosted, v1.4)
- AI Agent (v3.1, max 10 iterations)
- Anthropic Chat Model (claude-sonnet-4-20250514, temp 0.3, max 2048 tokens)
- Simple Memory (Window Buffer, 10 messages, session-based)
- 4 Workflow Tools (search_contacts, get_contact, search_cases, get_case) → call vc-chatbot-civicrm-sub
- 1 Code Tool (search_knowledge_base) → returns placeholder message until KB is built

**Tool pattern:** Workflow Tool nodes call vc-chatbot-civicrm-sub sub-workflow via n8n internal execution. Sub-workflow uses HTTP Request node with CiviCRM Custom Auth credential. No bearer tokens in vc-chatbot-stream.

**System prompt:** Comprehensive MAS AI Assistant instructions covering capabilities, guidelines, and tool usage patterns.

### vc-chatbot-knowledge (ID: mnodV7Z4bkPuuvGV)

**Status:** Skeleton only, inactive. Needs redesign for pgvector RAG.

---

## Knowledge Base Strategy

### Sources

| Source | Type | Volume | Access |
|--------|------|--------|--------|
| masadvise.org/blog | Web pages | ~50 posts | Public, scrape or manual copy |
| masadvise.org/mas-publications | Web pages/PDFs | ~30 docs | Public |
| SharePoint: MAS Resource Library | Word/Excel/PDF | ~100 files | Internal, manual download |
| SharePoint: VC Support Centre | Word/Excel/PDF | ~50 files | Internal, manual download |

**Total estimated:** 200-300 documents, mostly static (updated rarely).

### Storage: PostgreSQL + pgvector

**Why:** Brian already has Azure PostgreSQL. No additional services or costs.
**Extension:** Name is `vector` (not `pgvector`) for both Azure allowlist and CREATE EXTENSION.
**Confirmed:** pgvector fully supported on Azure Database for PostgreSQL Flexible Server.

**Setup steps:**
1. Azure Portal -> Server Parameters -> add `VECTOR` to azure.extensions allowlist
2. Connect to klaus database: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Verify: `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';`

**Schema:**

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE vc_knowledge_documents (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    title TEXT NOT NULL,
    filename TEXT,
    content TEXT NOT NULL,
    content_hash VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vc_knowledge_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES vc_knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON vc_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX ON vc_knowledge_documents (source_type);
CREATE INDEX ON vc_knowledge_chunks (document_id);
```

### Chunking Strategy

- Chunk size: 500 tokens (~2000 chars) with 100 token overlap
- Embedding model: OpenAI text-embedding-3-small (1536 dimensions, $0.02/1M tokens)

### RAG Retrieval SQL

```sql
SELECT c.chunk_text, d.title, d.source_type, d.source_url,
       1 - (c.embedding <=> $1::vector) AS similarity
FROM vc_knowledge_chunks c
JOIN vc_knowledge_documents d ON d.id = c.document_id
ORDER BY c.embedding <=> $1::vector
LIMIT 5;
```

---

## Implementation Roadmap

### ~~Phase 2: Build vc-chatbot-stream~~ COMPLETE
- AI Agent with Chat Trigger deployed
- 4 Workflow Tool nodes calling vc-chatbot-civicrm-sub (replaced Code Tools — `httpRequestWithAuthentication` not supported in Code Tool nodes)
- 1 Code Tool for knowledge base (placeholder)
- Window Buffer Memory configured
- Anthropic Claude Sonnet 4 as LLM
- All 4 CiviCRM tools verified returning real data (2026-02-11)

### Phase 1: Knowledge Base Infrastructure (2-3 hours) -- NEXT
1. Enable pgvector on Azure PostgreSQL (add VECTOR to allowlist, CREATE EXTENSION)
2. Run CREATE TABLE statements
3. Build vc-chatbot-ingest workflow
4. Extract and load documents from all 4 sources
5. Verify with test queries

### Phase 3: Testing (1-2 hours)
1. Test knowledge base queries
2. Test CiviCRM tool calls (already functional)
3. Test multi-turn conversations
4. Test edge cases
5. Run eval framework

### Phase 4: Deployment (1 hour)
1. Embed chat widget on masadvise.org (iframe or n8n hosted URL)
2. Share with pilot VCs

### Phase 5: Polish (ongoing)
1. Refine system prompt based on VC feedback
2. Add more documents to knowledge base
3. Consider upgrade to Option B if needed

---

## Credentials

| Credential | ID | Status | Used By |
|-----------|-----|--------|--------|
| CiviCRM Custom Auth | WIv1YM35QT3gS3E9 | Ready | civicrm-tool-handler, vc-chatbot-civicrm-sub |
| mas-vc-chatbot Header Auth | qNVAh8ZXzS0SxXm1 | Ready | civicrm-tool-handler webhook auth |
| Anthropic API | 7UPj62kj2GRdAC8j | Ready | vc-chatbot-stream AI Agent |
| OpenAI API | (check n8n) | Need to verify | Embeddings for pgvector |
| PostgreSQL (Azure) | (check n8n) | Ready | Knowledge base tables |

---

## Key Files and Repos

| Resource | Location |
|----------|----------|
| This document | GitHub: briangflett/mas-vc-chatbot/docs/HANDOFF.md |
| Design spec (canonical) | Klaus Google Drive: HANDOFF.md |
| civicrm-tool-handler | n8n workflow KKik67GlUddpDQED |
| vc-chatbot-civicrm-sub | n8n workflow nmVIws1rIVYhpgMi |
| vc-chatbot-stream | n8n workflow O0phZvFcYNr7BGis |
| vc-chatbot-knowledge | n8n workflow mnodV7Z4bkPuuvGV |
| CiviCRM eval spreadsheet | Google Sheets 1RI2FB7ynXu2xnrvZ382eBZZlQFzwrJZORajIBMH_13w |
| PostgreSQL | mas-n8n-postgress-db.postgres.database.azure.com (db: klaus) |

---

## Decisions Made

- **Architecture**: n8n Chat Trigger + AI Agent for MVP. Next.js streaming as future upgrade.
- **Tool auth**: Workflow Tool → sub-workflow → HTTP Request with CiviCRM Custom Auth. (Code Tool `httpRequestWithAuthentication` is NOT supported — discovered 2026-02-11.)
- **LLM**: claude-sonnet-4-20250514 (temp 0.3, max 2048 tokens)
- **Memory**: Window Buffer, 10 messages (5 exchanges), session-based
- **Knowledge base**: PostgreSQL + pgvector on existing Azure Postgres. Manual one-time ingestion.
- **Chat interface**: n8n Chat Trigger public hosted mode (fastest deployment path)
- **Package manager**: pnpm (for any Next.js work)

---

## Open Questions

1. **OpenAI API credential**: Confirm exists in n8n for embeddings.
2. **Document list**: Which specific Google Docs / SharePoint files should be indexed first?
3. **Chat widget branding**: n8n built-in Chat Trigger widget vs custom Next.js UI for MAS branding.
4. **Document refresh**: Consider scheduled re-ingestion if docs change quarterly.
5. **Access control**: Should all VCs see the same data, or respect CiviCRM permissions?

---

## Strategic Context

This project is one of two MAS consulting engagements being used to:
1. Deliver real value to MAS volunteer consultants
2. Build case studies for convincing other Canadian nonprofits to adopt AI
3. Demonstrate the "AI as knowledge retrieval assistant" pattern

The flywheel: deliver great projects -> extract case studies -> create demand -> land more engagements.

---

*Created: 2026-02-10*
*Last updated: 2026-02-11*
*Authors: Klaus (Brian's AI assistant), Claude Code (CLI)*