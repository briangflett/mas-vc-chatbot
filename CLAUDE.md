# MAS VC Chatbot - Claude Guide

## CRITICAL

**Security**: NO secrets in git. Check before every commit. See @/home/brian/SECURITY.md
**Document maintenance**: Keep docs current -- see "Session Protocol" below.

---

## Session Protocol

**Starting a session:**
1. Read `docs/HANDOFF.md` for current project state
2. Read `docs/DECISIONS.md` for architectural context

**Ending a session:**
1. Update `docs/HANDOFF.md` -- Last Updated, session summary, and any changed sections
2. Update `docs/DECISIONS.md` -- add new ADRs if architectural decisions were made
3. Update this file (`CLAUDE.md`) if the tech stack, workflow IDs, or key files changed

---

## Project Overview

**Purpose**: AI chatbot for MAS Volunteer Coordinators (~50 users) to search CiviCRM contacts/cases and query a knowledge base about MAS processes.
**Status**: Phase 2 complete (chat + CiviCRM tools working). Phase 1 KB infrastructure next.
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
                            +-- 1 Code Tool (KB placeholder)
```

**All business logic lives in n8n.** This repo contains docs and a dormant Next.js app (future upgrade path).

**Key constraint**: `httpRequestWithAuthentication()` is NOT supported in Code Tool nodes. Use Workflow Tool + sub-workflow pattern for any tool that needs credentials. See `docs/DECISIONS.md` ADR-002.

---

## n8n Workflows

| Workflow | ID | Status | Purpose |
|----------|----|--------|---------|
| vc-chatbot-stream | O0phZvFcYNr7BGis | Active | Main chat: Chat Trigger + AI Agent + tools + memory |
| vc-chatbot-civicrm-sub | nmVIws1rIVYhpgMi | Active | Sub-workflow: routes CiviCRM tool calls to API4 |
| civicrm-tool-handler | KKik67GlUddpDQED | Active | Standalone CiviCRM API wrapper with eval framework |
| vc-chatbot-knowledge | mnodV7Z4bkPuuvGV | Inactive | Skeleton -- needs pgvector RAG implementation |

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
| PostgreSQL (Azure) | (check n8n) | Knowledge base (future) |

---

## Key Files

**Documentation** (`docs/`):
- `HANDOFF.md` -- Canonical project state, architecture, roadmap, credentials
- `DECISIONS.md` -- Architectural Decision Records (ADRs)

**Next.js app** (dormant -- future Option B upgrade):
- `src/` -- Chat UI components, Drizzle ORM, SSE client
- Uses npm (not pnpm) if reactivated

**Related paths**:
- n8n workflow exports: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`
- CiviCRM API4 protocol: `/home/brian/workspace/claude/context/mas-claude-context/claude-code/global/protocols/api4.md`

---

## Tool Selection

| Tool | Use for |
|------|---------|
| **Claude Code CLI** | Edit files, git operations, testing |
| **Web interface** (claude.ai) | n8n MCP tools, GitHub access, workflow design |
| **n8n Web UI** | Visual workflow editing, credential management, execution logs |

**n8n MCP tools**: Use `mcp__n8n-mcp__` prefixed tools (most reliable). The `mcp__n8n__` tools may need `/mcp` re-authentication.

---

**Last Updated**: 2026-02-11
