MAS VC Chatbot — AI chatbot for MAS Volunteer Coordinators (~50 users).
Read the knowledge file (CLAUDE.md) first.

All business logic lives in n8n. This repo is docs + KB content + ingestion scripts.
CRITICAL: webhook body data FLAT ({ op: "save", key: "x" }), never nested.

Klaus integration: use bootstrap/wrapup skills for session lifecycle.
Handoffs: klaus-sql query handoff_items. Learnings: auto-memory (MEMORY.md).
BrianPKM .md files: use klaus-gdrive-docs op:"read", not native google_drive_fetch.