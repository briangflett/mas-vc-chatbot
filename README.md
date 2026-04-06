# MAS VC Chatbot

AI chatbot for MAS (Management Advisory Service) Volunteer Coordinators (~50 users). Searches CiviCRM contacts/cases and queries a knowledge base about MAS processes.

## Architecture

All business logic runs in **n8n workflows** on [n8n.masadvise.org](https://n8n.masadvise.org). The chat interface uses n8n's built-in Chat Trigger widget, embedded on masadvise.org via WordPress.

```
n8n Chat Trigger (public hosted) -> AI Agent -> [Streaming Response]
                                      |
                            +-- Anthropic Claude Sonnet 4 (LLM)
                            +-- Window Buffer Memory (10 messages)
                            +-- 4 CiviCRM Tools -> vc-chatbot-civicrm-sub -> CiviCRM API4
                            +-- 1 KB Search Tool -> PGVector Store (pgvector on Azure PostgreSQL)
```

## n8n Workflows

| Workflow | ID | Status | Purpose |
|----------|----|--------|---------|
| vc-chatbot-stream | O0phZvFcYNr7BGis | Active | Main chat: Chat Trigger + AI Agent + tools + memory |
| vc-chatbot-civicrm-sub | nmVIws1rIVYhpgMi | Active | Sub-workflow: routes CiviCRM tool calls to API4 |
| vc-chatbot-ingest | d1yOknmooRczDmIc | Active | KB document ingestion into pgvector |
| civicrm-tool-handler | KKik67GlUddpDQED | Active | Standalone CiviCRM API wrapper with eval framework |

## Documentation

- [HANDOFF.md](docs/HANDOFF.md) - Canonical project state, architecture, roadmap
- [DECISIONS.md](docs/DECISIONS.md) - Architectural Decision Records
- [KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md) - KB document templates and setup
- [CIVICRM_TOOLS.md](docs/CIVICRM_TOOLS.md) - CiviCRM tool specifications
- [N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md) - Workflow architecture details

## Related

- Workflow JSON exports: [`briangflett/n8n-brian-workflows`](https://github.com/briangflett/n8n-brian-workflows) (private) under `mas-vc-chatbot/workflows/`
- n8n instance: https://n8n.masadvise.org
