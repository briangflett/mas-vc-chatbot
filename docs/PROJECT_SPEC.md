# MAS VC Chatbot — Project Specification

> Design specification for the MAS Volunteer Coordinator AI Chatbot.
> For current project state, check Postgres handoff_items via klaus-sql.
> For architectural decisions, see BrianPKM `1-Projects/mas-vc-chatbot-decisions.md`.

---

## Project Overview

**Goal:** Build an AI chatbot for MAS (Management Advisory Service) Volunteer Coordinators (VCs) that can answer questions about MAS processes, search contacts/cases in CiviCRM, and provide guidance from MAS's knowledge base.

**Target Users:** ~50 active Volunteer Coordinators who manage nonprofit consulting engagements for MAS.

**Deployment:** Embedded chat widget on masadvise.org (WordPress), powered by n8n Chat Trigger + Anthropic Claude.

---

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

**Nodes:**
- Chat Trigger (public hosted, v1.4)
- AI Agent (v3.1, max 10 iterations)
- Anthropic Chat Model (claude-sonnet-4-20250514, temp 0.3, max 2048 tokens)
- Simple Memory (Window Buffer, 10 messages, session-based)
- 4 Workflow Tools (search_contacts, get_contact, search_cases, get_case) → call vc-chatbot-civicrm-sub
- 1 KB Search Tool → PGVector Store (pgvector on Azure PostgreSQL)

**Tool pattern:** Workflow Tool nodes call vc-chatbot-civicrm-sub sub-workflow via n8n internal execution. Sub-workflow uses HTTP Request node with CiviCRM Custom Auth credential. No bearer tokens in vc-chatbot-stream.

**System prompt:** Comprehensive MAS AI Assistant instructions covering capabilities, guidelines, and tool usage patterns.

### vc-chatbot-ingest (ID: d1yOknmooRczDmIc)

**Status:** Broken. PGVector Store node fails due to azure_pg_admin role. KB was loaded via Python script instead (482 vectors from 80 documents, 2026-04-06). See handoff #73.

---

## Knowledge Base

### Current State (as of 2026-04-06)

**482 vectors** ingested from **80 documents** across 4 sources via Python script (`scripts/ingest_kb.py`).

### Sources

| Source | Type | Documents | Access |
|--------|------|-----------|--------|
| masadvise.org (Firecrawl) | Web pages | 19 pages + 32 articles | Public |
| Google Drive publications | PDFs | 14 docs | MAS Google Drive |
| SharePoint: VC Support Centre | Word/Excel/PDF | 9 docs | Internal |
| SharePoint: Resource Library | Word/Excel/PDF | 6 index docs | Internal |

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

### ~~Phase 1: CiviCRM Tools~~ COMPLETE (2026-02-11)
- civicrm-tool-handler built with eval framework
- vc-chatbot-civicrm-sub sub-workflow for credential isolation

### ~~Phase 2: Build vc-chatbot-stream~~ COMPLETE (2026-02-11)
- AI Agent with Chat Trigger deployed
- 4 Workflow Tool nodes calling vc-chatbot-civicrm-sub
- Window Buffer Memory configured
- Anthropic Claude Sonnet 4 as LLM

### ~~Phase 3: Knowledge Base~~ COMPLETE (2026-04-06)
- pgvector enabled on Azure PostgreSQL
- 482 vectors from 80 documents ingested via Python script
- KB search tool connected in vc-chatbot-stream

### Phase 4: Testing & Deployment — NEXT
1. Test KB retrieval via n8n Chat Trigger URL
2. Refine system prompt (KB categories, citations, scope)
3. Embed chat widget on masadvise.org (WordPress)
4. Soft launch with pilot VCs

### Phase 5: Polish (ongoing)
1. Refine system prompt based on VC feedback
2. Add more documents to knowledge base
3. Fix or replace vc-chatbot-ingest workflow
4. Consider upgrade to Next.js UI if needed

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
| This document | GitHub: briangflett/mas-vc-chatbot/docs/PROJECT_SPEC.md |
| Decisions (ADRs) | BrianPKM: 1-Projects/mas-vc-chatbot-decisions.md |
| civicrm-tool-handler | n8n workflow KKik67GlUddpDQED |
| vc-chatbot-civicrm-sub | n8n workflow nmVIws1rIVYhpgMi |
| vc-chatbot-stream | n8n workflow O0phZvFcYNr7BGis |
| vc-chatbot-ingest | n8n workflow d1yOknmooRczDmIc (broken) |
| KB ingestion script | scripts/ingest_kb.py |
| CiviCRM eval spreadsheet | Google Sheets 1RI2FB7ynXu2xnrvZ382eBZZlQFzwrJZORajIBMH_13w |
| PostgreSQL | mas-n8n-postgress-db.postgres.database.azure.com (db: klaus) |

---

## Decisions

See BrianPKM `1-Projects/mas-vc-chatbot-decisions.md` for full ADRs (8 decisions recorded).

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
*Last updated: 2026-04-07*