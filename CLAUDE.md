# MAS VC Chatbot - Claude Guide

## CRITICAL: Security

**NEVER commit secrets to git.** Check before every commit: `git diff --cached`
Real secrets ONLY in `.env.local` (git-ignored). Reference: @/home/brian/SECURITY.md

---

## Session Lifecycle

- **Start**: `/bootstrap` (loads Klaus context, checks pending handoffs)
- **End**: `/wrapup` (logs summary, updates SESSIONS, handles handoffs, checks git)

**Project-specific context** (read at session start):
1. `docs/HANDOFF.md` — current project state
2. `docs/DECISIONS.md` — architectural context (add new ADRs when decisions are made)

---

## Project Overview

**Purpose**: AI chatbot for MAS Volunteer Coordinators (~50 users) to search CiviCRM contacts/cases and query a knowledge base about MAS processes.
**Status**: CiviCRM tools working, KB infrastructure ready (pgvector + ingest pipeline), populating KB content.
**Deployment**: n8n Chat Trigger widget embedded on masadvise.org (WordPress).
**Working Directory**: `/home/brian/workspace/development/mas-vc-chatbot`

---

## Architecture

```
n8n Chat Trigger (public hosted) -> AI Agent -> [Streaming Response]
                                      |
                            +-- Anthropic Claude Sonnet 4 (LLM)
                            +-- Window Buffer Memory (10 messages)
                            +-- 4 Workflow Tools -> vc-chatbot-civicrm-sub -> CiviCRM API4
                            +-- 1 KB Search Tool -> PGVector Store (pgvector on Azure PostgreSQL)
```

**All business logic lives in n8n.** This repo contains project documentation and KB content.

**Key constraint**: `httpRequestWithAuthentication()` is NOT supported in Code Tool nodes. Use Workflow Tool + sub-workflow pattern for any tool that needs credentials. See `docs/DECISIONS.md` ADR-002.

---

## n8n Workflows

| Workflow | ID | Status | Purpose |
|----------|----|--------|---------|
| vc-chatbot-stream | O0phZvFcYNr7BGis | Active | Main chat: Chat Trigger + AI Agent + tools + memory |
| vc-chatbot-civicrm-sub | nmVIws1rIVYhpgMi | Active | Sub-workflow: routes CiviCRM tool calls to API4 |
| vc-chatbot-ingest | d1yOknmooRczDmIc | Active | KB document ingestion into pgvector |
| civicrm-tool-handler | KKik67GlUddpDQED | Active | Standalone CiviCRM API wrapper with eval framework |

**n8n instance**: https://n8n.masadvise.org

---

## CiviCRM Tools

| Tool | What it does |
|------|-------------|
| search_contacts | Search by name/email/org with filter_type (all/active_vcs/org_employees) |
| get_contact | Full contact details by contactId |
| search_cases | Search cases by VC, org, status, unassigned flag |
| get_case | Full case details with custom fields by caseId |

**API pattern**: Code node builds params -> stringify -> POST to `/civicrm/ajax/api4/{entity}/{action}` (form-urlencoded). Uses CiviCRM Custom Auth credential (ID: WIv1YM35QT3gS3E9).

---

## Credentials (in n8n)

| Credential | ID | Used By |
|-----------|-----|---------|
| CiviCRM Custom Auth | WIv1YM35QT3gS3E9 | civicrm-tool-handler, vc-chatbot-civicrm-sub |
| Anthropic API | 7UPj62kj2GRdAC8j | vc-chatbot-stream |
| OpenAI API | (check n8n) | Embeddings for KB ingestion and retrieval |
| PostgreSQL (Azure) | (check n8n) | Knowledge base vector store |

---

## Key Files

**Documentation** (`docs/`):
- `HANDOFF.md` — Canonical project state, architecture, roadmap, credentials
- `DECISIONS.md` — Architectural Decision Records (ADRs)
- `KNOWLEDGE_BASE.md` — KB document templates and setup guide
- `CIVICRM_TOOLS.md` — CiviCRM tool specifications
- `CIVICRM_API_V4_REFERENCE.md` — CiviCRM API4 patterns
- `N8N_WORKFLOWS.md` — Workflow architecture details
- `QUICK_REFERENCE.md` — Quick reference

**KB content** (`docs/kb-content/`):
- Authored knowledge base documents for ingestion into pgvector

**Related paths**:
- n8n workflow exports: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/workflows/`
- Sync script: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/scripts/sync-workflows.sh`
- CiviCRM API4 protocol: `/home/brian/workspace/claude/context/mas-claude-context/claude-code/global/protocols/api4.md`

---

## Tool Selection

| Tool | Use for |
|------|---------|
| **Claude Code CLI** | Edit files, git operations, testing |
| **Web interface** (claude.ai) | n8n MCP tools, GitHub access, workflow design |
| **n8n Web UI** | Visual workflow editing, credential management, execution logs |

---

## Klaus Integration

Klaus capabilities are provided via the globally available `klaus-workflows`, `bootstrap`, and `wrapup` skills.

---

**Last Updated**: 2026-04-06
