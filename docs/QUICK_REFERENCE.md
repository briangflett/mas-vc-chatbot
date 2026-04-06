# VC Chatbot - Quick Reference Summary

**Last Updated**: 2026-01-17
**Status**: Ready for implementation

---

## 🎯 Project Goal

Build an AI chatbot for MAS volunteer consultants that:
- Answers questions using MAS knowledge base
- Retrieves client/case data from CiviCRM
- Streams responses in real-time
- Works seamlessly in VC portal
- Reuses CiviCRM tools for future MCP server

---

## 📁 Documentation Map

All documents are in `/docs/` folder:

| Document | Purpose | Read When |
|----------|---------|-----------|
| **VC_CHATBOT_PROJECT.md** | Complete project overview | Start here - understanding vision |
| **VC_CHATBOT_CIVICRM_TOOLS.md** | CiviCRM tool specification | Building tools in n8n or MCP |
| **VC_CHATBOT_KNOWLEDGE_BASE.md** | Knowledge base setup | Creating Google Docs content |
| **VC_CHATBOT_IMPLEMENTATION_CHECKLIST.md** | Step-by-step tasks | At laptop, ready to code |
| **VC_CHATBOT_N8N_WORKFLOWS.md** | n8n workflow templates | Building in n8n UI |
| **This Document** | Quick reference | Need quick overview |

---

## 🏗️ Architecture Summary

```
VC Portal (Next.js)          n8n Workflows              Data Sources
    │                             │                          │
    ├─ Chat UI ─────────────►  Stream        ────────►  Claude API
    ├─ SSE Client              Workflow                     │
    ├─ Message Store              │                         │
    │   (Postgres)                ├─────────────────────────┤
    │                             │                         │
    └─ Auth & Sessions       CiviCRM Tool  ────────►  CiviCRM API
                             Handler                  (Contacts/Cases)
                                  │
                             Knowledge     ────────►  Google Drive
                             Fetcher                  (Docs)
```

### Technology Stack

**Frontend**: Next.js 15 + shadcn/ui + Tailwind
**Backend Logic**: n8n workflows (visual, maintainable)
**AI**: Claude API (Anthropic)
**Database**: Postgres (VC portal database)
**Knowledge**: Google Docs → Google Drive API

---

## 🔧 Three Main Components

### 1. CiviCRM Tool Handler (n8n)
**File**: `civicrm-tool-handler.json`
**Purpose**: Reusable API wrapper for 4 tools
**Tools**:
- `search_contacts` - Find contacts by name/email/org
- `get_contact` - Get full contact details by ID
- `search_cases` - Find cases with filters
- `get_case` - Get full case details + activities

**Endpoint**: `https://n8n.masadvise.org/webhook/civicrm-tool`

**Used By**: 
- VC chatbot (via Claude tool calling)
- Future MCP server (same interface!)

### 2. Knowledge Base Fetcher (n8n)
**File**: `vc-chatbot-knowledge.json`
**Purpose**: Fetch MAS docs from Google Drive
**Output**: Consolidated JSON knowledge base
**Used By**: Main streaming workflow (system prompt)

### 3. Main Streaming Workflow (n8n)
**File**: `vc-chatbot-stream.json`
**Purpose**: Orchestrate chat with SSE streaming
**Flow**:
1. Receive message from VC portal
2. Fetch knowledge base
3. Call Claude API with streaming
4. Handle tool calls (CiviCRM)
5. Stream response back to UI

**Endpoint**: `https://n8n.masadvise.org/webhook/vc-chat-stream`

---

## 📋 Implementation Phases

### Phase 1: MVP (3 weeks) ← **Current Focus**

**Week 1**: Foundation
- Database schema (Postgres)
- n8n CiviCRM tool handler
- Google Drive knowledge base
- Environment variables

**Week 2**: Streaming
- n8n knowledge fetcher
- n8n streaming workflow
- Claude API integration

**Week 3**: Frontend
- Next.js chat UI
- SSE streaming client
- Message persistence
- Testing & polish

**Deliverables**:
- ✅ Working chatbot in VC portal
- ✅ 4 CiviCRM tools functional
- ✅ Knowledge base accessible
- ✅ Real-time streaming

### Phase 2: Enhanced (3 weeks)
- Dynamic content fetching
- Better source citations
- Tool usage transparency
- Enhanced error handling

### Phase 3: Vector DB (4-6 weeks)
- Semantic search
- Automated content ingestion
- Blog posts indexed
- Advanced caching

### Phase 4: MCP Server (Future)
- Reuse same CiviCRM tools
- Works in Claude Desktop
- Works in ChatGPT
- Zero tool changes needed!

---

## 🚀 Getting Started (When at Laptop)

### Prerequisites Checklist
- [ ] n8n.masadvise.org access
- [ ] CiviCRM API credentials
- [ ] VC portal repository access
- [ ] Postgres database access
- [ ] Anthropic API key
- [ ] Google Drive API credentials
- [ ] Webhook secret generated

### Quick Start Steps

1. **Set up environment variables**
   ```bash
   # VC Portal .env.local
   N8N_WEBHOOK_URL=https://n8n.masadvise.org
   N8N_WEBHOOK_SECRET=<generate-random>
   ```

2. **Create database tables**
   ```bash
   # Run SQL from implementation checklist
   # Creates consultant_chat_conversations & messages
   ```

3. **Build n8n workflows** (use templates in N8N_WORKFLOWS.md)
   - civicrm-tool-handler
   - vc-chatbot-knowledge
   - vc-chatbot-stream

4. **Create Google Drive knowledge base**
   - Use templates from KNOWLEDGE_BASE.md
   - Set up folder structure
   - Write initial documents

5. **Implement Next.js UI**
   - Create directory structure
   - Implement streaming components
   - Connect to n8n webhooks
   - Test end-to-end

---

## 📝 Key Design Decisions

### Why This Architecture?

**n8n for Business Logic**:
- ✅ Visual, easy to understand
- ✅ Can be updated without deployments
- ✅ Non-developers can maintain
- ✅ Proven with Allard Prize

**Reusable CiviCRM Tools**:
- ✅ Same tools work for chatbot AND MCP
- ✅ OpenAPI-compatible specification
- ✅ Future-proof design
- ✅ Single source of truth

**Streaming Responses**:
- ✅ Better UX (see responses immediately)
- ✅ Standard SSE approach
- ✅ Works great with Claude API

**Postgres for History**:
- ✅ Conversations persist
- ✅ Standard relational model
- ✅ Easy to query and analyze
- ✅ Integrates with VC portal

---

## 🔍 Testing Strategy

### Unit Tests (n8n)
- Test each CiviCRM tool independently
- Verify error handling
- Check response formats
- Validate input parameters

### Integration Tests
- Test full conversation flow
- Verify streaming works
- Check tool calling
- Test database persistence

### User Acceptance Testing
- Real VCs test chatbot
- Verify knowledge base accuracy
- Check UX smoothness
- Collect feedback

---

## 📚 Common Questions

### Q: Why n8n instead of all Next.js?
**A**: Business logic in n8n is easier to update, visualize, and maintain. VCs and non-developers can understand and improve workflows.

### Q: Can I use these CiviCRM tools elsewhere?
**A**: Yes! Same tools work in future MCP server for Claude Desktop and ChatGPT. Zero code changes needed.

### Q: What if knowledge base gets stale?
**A**: Phase 1 uses manual updates. Phase 3 adds automated daily sync and vector database.

### Q: How do I update the chatbot without redeploying?
**A**: Update n8n workflows (business logic) or Google Docs (knowledge) - no deployment needed.

### Q: What about security?
**A**: Webhook authentication, VC portal login required, CiviCRM permissions respected, no data export.

---

## 🎯 Success Metrics (Phase 1)

- [ ] Chatbot responds within 3 seconds (average)
- [ ] 95%+ uptime for streaming
- [ ] Zero critical errors in tool calls
- [ ] VCs successfully retrieve CiviCRM data via chat
- [ ] Knowledge base answers 80%+ of common questions
- [ ] Positive feedback from 80%+ of test VCs

---

## 🛠️ Troubleshooting

### Streaming Not Working
1. Check n8n workflow is activated
2. Verify webhook secret matches
3. Check browser console for SSE errors
4. Test n8n webhook directly with curl

### CiviCRM Tools Failing
1. Verify CiviCRM API credentials in n8n
2. Check CiviCRM is accessible
3. Test API call manually
4. Check timeout settings (10 sec default)

### Knowledge Base Empty
1. Check Google Drive permissions
2. Verify workflow fetches docs
3. Check folder ID is correct
4. Test knowledge workflow manually

### Messages Not Saving
1. Check database connection
2. Verify table schema correct
3. Check foreign key constraints
4. Test insert manually

---

## 📞 Getting Help

**Documentation Issues**:
- Check other docs in `/docs/`
- Review mas-ai-chatbot for Next.js examples
- Review allard-prize for n8n examples

**Implementation Questions**:
- Use implementation checklist
- Refer to n8n workflow templates
- Ask Claude Code for specific code help

**Blockers**:
- Document in project notes
- Create GitHub issue
- Update checklist with workarounds

---

## 🎉 What's Next?

### Immediate (Week 1)
1. Read VC_CHATBOT_PROJECT.md (full context)
2. Read VC_CHATBOT_CIVICRM_TOOLS.md (tool spec)
3. Read VC_CHATBOT_IMPLEMENTATION_CHECKLIST.md (tasks)
4. Start building at laptop!

### Near-term (Weeks 2-3)
- Build n8n workflows
- Implement Next.js UI
- Create knowledge base
- Test with real VCs

### Long-term (Months 2-6)
- Phase 2: Enhanced features
- Phase 3: Vector database
- Phase 4: MCP server
- Scale to all VCs

---

## 📦 File Locations

**Planning Documents** (where you are now):
```
/home/brian/workspace/workflows/npaiadvisor-strategy/docs/
├── VC_CHATBOT_PROJECT.md
├── VC_CHATBOT_CIVICRM_TOOLS.md
├── VC_CHATBOT_KNOWLEDGE_BASE.md
├── VC_CHATBOT_IMPLEMENTATION_CHECKLIST.md
├── VC_CHATBOT_N8N_WORKFLOWS.md
└── VC_CHATBOT_QUICK_REFERENCE.md (this file)
```

**Implementation Files** (to be created):
```
# n8n workflows (export after building in UI)
/home/brian/workspace/workflows/vc-chatbot/
├── civicrm-tool-handler.json
├── vc-chatbot-knowledge.json
└── vc-chatbot-stream.json

# VC Portal (Next.js)
/path/to/vc-portal/
├── app/(protected)/consultant-chat/
├── components/consultant-chat/
└── lib/n8n/
```

**Google Drive**:
```
VC Chatbot Knowledge Base/
├── Core Information/
├── Workflows/
└── Technical/
```

---

## ✅ Ready to Start?

**You've completed the planning phase!**

Next steps when at your laptop:
1. Open VC_CHATBOT_IMPLEMENTATION_CHECKLIST.md
2. Verify prerequisites
3. Start with Week 1, Day 1
4. Follow checklist step-by-step
5. Update checklist as you progress

**Good luck! 🚀**

---

**Last Updated**: 2026-01-17
**Created By**: Brian Flett + Claude
**Status**: Ready for implementation
