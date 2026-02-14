# Architectural Decision Records

> Key decisions made during the MAS VC Chatbot project.
> Update this file when significant architectural choices are made.

---

## ADR-001: n8n Chat Trigger for UI Instead of Next.js

**Date:** 2026-02-10
**Status:** Accepted

**Context:** We initially built a Next.js chat UI (Phase 1) with SSE streaming client, Drizzle ORM, and shadcn/ui components. The plan was to connect it to n8n webhooks for AI orchestration.

**Decision:** Use n8n's built-in Chat Trigger (public hosted mode) as the chat UI instead of the Next.js app.

**Rationale:**
- Chat Trigger provides streaming responses out of the box -- no custom SSE implementation needed
- Dramatically reduces deployment complexity (no Vercel, no separate frontend)
- Faster time to MVP for ~50 volunteer coordinators
- The Next.js app remains as a future upgrade path (Option B) if VCs need richer UI/branding

**Consequences:**
- Next.js source code in this repo is dormant (kept for potential future use)
- Chat widget branding is limited to n8n's Chat Trigger customization options
- All business logic lives entirely in n8n workflows

---

## ADR-002: Workflow Tool Nodes Instead of Code Tool Nodes

**Date:** 2026-02-11
**Status:** Accepted

**Context:** The original vc-chatbot-stream workflow used Code Tool nodes (`@n8n/n8n-nodes-langchain.toolCode`) for CiviCRM API calls. These nodes called `this.helpers.httpRequestWithAuthentication()` to use stored credentials.

**Problem:** `httpRequestWithAuthentication()` is **not supported** in Code Tool nodes. It only works in regular Code nodes (`n8n-nodes-base.code`). The CiviCRM tools silently failed, returning empty results in ~8ms.

**Decision:** Replace Code Tool nodes with Workflow Tool nodes (`@n8n/n8n-nodes-langchain.toolWorkflow` v2) that call a shared sub-workflow.

**Alternatives considered:**
1. **HTTP Request Tool** (`toolHttpRequest`) -- rejected because it can't handle optional/conditional parameters in nested JSON request bodies
2. **fetch() with env vars** -- rejected for security (hardcoded tokens)
3. **Workflow Tool + sub-workflow** -- chosen for full credential access and flexibility

**Consequences:**
- Created `vc-chatbot-civicrm-sub` sub-workflow (must be active for tools to work)
- CiviCRM Custom Auth credential used only in the sub-workflow, not in vc-chatbot-stream
- Slightly more complex architecture (2 workflows instead of 1) but cleanly separated

---

## ADR-003: Single Sub-Workflow with Routing

**Date:** 2026-02-11
**Status:** Accepted

**Context:** With 4 CiviCRM tools needing sub-workflow execution, we could create 4 separate sub-workflows or 1 shared one.

**Decision:** Single sub-workflow (`vc-chatbot-civicrm-sub`) with a Switch node that routes by `toolName` parameter.

**Rationale:**
- One place to manage CiviCRM credential and API base URL
- One HTTP Request node shared by all tools
- Easier to maintain, test, and debug
- Adding new tools = add a Switch output + Build Request code node

**Consequences:**
- All tool parameters must be defined on the Execute Workflow Trigger (flat input schema)
- Switch node routes to the correct Build Request code node per tool

---

## ADR-004: PostgreSQL + pgvector for Knowledge Base

**Date:** 2026-02-10
**Status:** Accepted (not yet implemented)

**Context:** Need vector storage for RAG-based knowledge retrieval from ~200-300 MAS documents.

**Decision:** Use pgvector extension on Brian's existing Azure Database for PostgreSQL Flexible Server.

**Rationale:**
- Zero additional cost (existing Azure Postgres instance)
- pgvector fully supported on Azure Flexible Server
- No new services to manage (vs. Pinecone, Weaviate, etc.)
- Simple SQL-based retrieval integrates naturally with n8n

**Details:**
- Extension name: `vector` (not `pgvector`) for Azure allowlist and CREATE EXTENSION
- Database: `klaus` on `mas-n8n-postgress-db.postgres.database.azure.com`
- Embedding model: OpenAI text-embedding-3-small (1536 dimensions)
- Chunking: 500 tokens with 100 token overlap

---

## ADR-005: Claude Sonnet 4 with Conservative Settings

**Date:** 2026-02-10
**Status:** Accepted

**Context:** Need to select an LLM for the AI Agent that balances capability, cost, and response quality for volunteer coordinators.

**Decision:** Claude Sonnet 4 (`claude-sonnet-4-20250514`) with temperature 0.3 and max 2048 output tokens.

**Rationale:**
- Sonnet 4 provides strong tool-use capability at reasonable cost
- Low temperature (0.3) keeps responses factual and consistent for operational queries
- 2048 token limit prevents excessively long responses while allowing detailed answers
- Max 10 agent iterations prevents runaway tool loops

---

## ADR-006: Window Buffer Memory (Session-Based)

**Date:** 2026-02-10
**Status:** Accepted

**Context:** Need conversation memory so VCs can have multi-turn conversations with context.

**Decision:** Window Buffer Memory with 10 messages (5 exchanges), session-based.

**Rationale:**
- Simple and sufficient for task-oriented VC queries
- Session-based means each browser session gets fresh context
- 10 messages keeps context relevant without excessive token usage
- No persistent memory needed (VCs ask operational questions, not long-running conversations)

---

## ADR-007: CiviCRM API4 via REST with Form-Urlencoded

**Date:** 2026-02-10
**Status:** Accepted

**Context:** Need to call CiviCRM from n8n to search contacts and cases.

**Decision:** POST to `/civicrm/ajax/api4/{entity}/{action}` with form-urlencoded body containing stringified `params` JSON.

**Rationale:**
- CiviCRM API4 is the only supported API version (v3 deprecated)
- REST endpoint works from n8n without CiviCRM PHP extensions
- Form-urlencoded with stringified params is the documented pattern for CiviCRM AJAX API4
- CiviCRM Custom Auth credential in n8n handles authentication headers

**Pattern:**
```
Code node builds: { select, where, join, limit, orderBy }
Stringify to: params=JSON.stringify(paramsObject)
POST to: https://masadvise.org/civicrm/ajax/api4/Contact/get
Content-Type: application/x-www-form-urlencoded
```

---

## ADR-008: n8n Chat Trigger Public Hosted Mode

**Date:** 2026-02-10
**Status:** Accepted

**Context:** Need to deploy the chat widget accessible to VCs on masadvise.org.

**Decision:** Use n8n Chat Trigger in public hosted mode, embeddable via iframe on WordPress.

**Rationale:**
- Fastest deployment path -- no custom frontend needed
- Allowed origins restricted to `https://www.masadvise.org`
- Built-in session management and streaming
- Can be replaced with custom UI later (ADR-001, Option B)

**Consequences:**
- Limited branding customization
- Dependent on n8n instance availability
- Widget styling controlled by n8n, not MAS brand guidelines

---

*Last updated: 2026-02-11*
