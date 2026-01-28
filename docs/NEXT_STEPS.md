# MAS VC Chatbot - Next Steps

**Last Updated**: 2026-01-18
**Status**: Phase 1 Complete - UI working with mock data ✅

---

## ✅ Completed (Phase 1)

### Local Development Environment
- ✅ Database created in Docker Postgres (`vc_chatbot`)
- ✅ Core dependencies installed (Drizzle, postgres, UI libraries)
- ✅ Environment variables configured (`.env.local`)
- ✅ Drizzle ORM set up with local Postgres
- ✅ Database schema created with varchar IDs (User, Chat, Message)
- ✅ Migrations generated and applied
- ✅ shadcn/ui configured with core components

### Chat UI Complete
- ✅ SSE client created (`src/lib/n8n/streaming-client.ts`) with mock and real functions
- ✅ TypeScript types defined (`src/lib/n8n/types.ts`)
- ✅ Database query helpers (`src/lib/db/queries.ts`)
- ✅ Chat components created (message, message-list, message-input, chat-interface)
- ✅ Chat routes implemented (`app/(chat)/`)
- ✅ API route for message persistence
- ✅ Auto-scroll to latest message
- ✅ Auto-focus input after response
- ✅ Mock streaming working perfectly

### Development Environment Integration
- ✅ Assigned to port 3003
- ✅ Added to `/var/www/html/index.html` dashboard
- ✅ Added to `/var/www/html/dev-control.php` control panel
- ✅ Integrated with `dev-manager.sh` for start/stop control
- ✅ Documentation updated (CLAUDE.md, README.md, TESTING_GUIDE.md)

### Testing
- ✅ Mock data streaming works
- ✅ Messages persist to database
- ✅ UI is responsive and smooth
- ✅ Can test locally without n8n

---

## 🔨 Manual n8n Setup (Do While Waiting for Rate Limit)

These steps can be done manually at https://n8n.masadvise.org to start Phase 2 preparation.

### 1. Create Workflow Skeletons

**Create three empty workflows**:

1. **vc-chatbot-stream** - Main orchestration workflow
   - Purpose: Receives chat messages, orchestrates AI + tools, streams responses
   - Expected inputs: `message`, `chatId`, `userId`, `timestamp`
   - Expected output: SSE stream with chunks

2. **civicrm-tool-handler** - CiviCRM API v4 tools
   - Purpose: Provides 4 reusable CiviCRM tools
   - Tools: `search_contacts`, `get_contact`, `search_cases`, `get_case`
   - Called by main workflow when Claude requests tool use

3. **vc-chatbot-knowledge** - Knowledge base retrieval
   - Purpose: Fetches VC portal documentation and MAS website content
   - Sources: Google Docs, web pages
   - Returns: Relevant context for AI

### 2. Configure Webhook URL and Authentication

**For vc-chatbot-stream workflow**:

1. Add "Webhook" node at the start
2. Set webhook path: `/webhook/vc-chat-stream`
3. Set HTTP method: `POST`
4. Enable authentication:
   - Type: "Header Auth"
   - Name: "Authorization"
   - Value: Generate a random bearer token
   ```bash
   # Generate token locally:
   openssl rand -base64 32
   ```
5. Save the token to add to `.env.local` later
6. Set "Response Mode" to "Last Node"

### 3. Set Up Claude API Credentials

**In n8n Settings > Credentials**:

1. Create new credential: "Anthropic API"
2. Name: "Claude API - MAS"
3. API Key: (use existing MAS Anthropic API key)
4. Save credential

### 4. Prepare CiviCRM API Connection

**In n8n Settings > Credentials** (or in workflow):

1. Create "HTTP Request" credential for CiviCRM
2. Base URL: `https://masadvise.org/wp-admin/admin.php?page=CiviCRM&q=civicrm/ajax/rest`
3. Authentication: Basic Auth or API key (check existing CiviCRM credentials in n8n)
4. Test connection with simple API call

### 5. Review Existing n8n Workflow Patterns

**Reference these existing workflows for patterns**:

```bash
# View related n8n documentation
cat /home/brian/workspace/workflows/allard-prize/N8N_AI_GUIDANCE.md
cat /home/brian/workspace/workflows/allard-prize/WORKFLOW_PATTERNS.md
cat /home/brian/workspace/workflows/allard-prize/N8N_BEST_PRACTICES.md
```

**Look for examples of**:
- SSE streaming responses
- Claude API with tools
- Webhook authentication
- Error handling patterns

### 6. Plan Tool Definitions

**Document the 4 CiviCRM tools** (for Claude to implement later):

1. **search_contacts**
   - Input: `query` (name/email), `organization`, `limit`
   - Output: Array of contacts with id, name, email, organization
   - API: CiviCRM API v4 `Contact.get`

2. **get_contact**
   - Input: `contact_id`
   - Output: Full contact details including custom fields
   - API: CiviCRM API v4 `Contact.get`

3. **search_cases**
   - Input: `contact_id`, `case_type`, `status`, `start_date`, `end_date`
   - Output: Array of cases with details
   - API: CiviCRM API v4 `Case.get`

4. **get_case**
   - Input: `case_id`
   - Output: Full case details including activities timeline
   - API: CiviCRM API v4 `Case.get` with joined Activity data

### 7. Prepare Knowledge Base Sources

**Identify Google Docs to include**:
- VC portal documentation URLs
- MAS website pages (About, Services, etc.)
- Any VC training materials

**Create a list** to share with Claude for implementation.

---

## 🤖 Post-Rate-Limit Tasks (For Claude to Complete)

Once Claude's rate limit resets, these are the remaining implementation tasks.

### Phase 2: n8n Workflow Implementation

#### Task 1: Build civicrm-tool-handler Workflow

**Workflow structure**:
```
Webhook (trigger)
  ↓
Switch Node (route by tool_name)
  ↓
Branch 1: search_contacts → HTTP Request to CiviCRM API
Branch 2: get_contact → HTTP Request to CiviCRM API
Branch 3: search_cases → HTTP Request to CiviCRM API
Branch 4: get_case → HTTP Request to CiviCRM API
  ↓
Format Response Node
  ↓
Respond to Webhook
```

**Specifics**:
- Use CiviCRM API v4 (NEVER API v3)
- Set `checkPermissions: FALSE` in API calls
- Use contact/case names instead of IDs where possible
- Return structured JSON responses

#### Task 2: Build vc-chatbot-knowledge Workflow

**Workflow structure**:
```
Webhook (trigger with search_query parameter)
  ↓
HTTP Request to Google Docs API (fetch relevant docs)
  ↓
Extract and format content
  ↓
Return formatted knowledge
```

**Or simpler MVP**:
```
Webhook (trigger)
  ↓
Return static Google Docs content (pre-fetched)
  ↓
(Phase 3: Add vector search for dynamic retrieval)
```

#### Task 3: Build vc-chatbot-stream Workflow (Main Orchestration)

**Workflow structure**:
```
Webhook (receives chat message, keeps connection open for SSE)
  ↓
Fetch Knowledge (call vc-chatbot-knowledge workflow)
  ↓
Claude API Node (streaming enabled, with tools)
  - Tool definitions point to civicrm-tool-handler
  - System prompt includes VC portal context
  - Streaming enabled
  ↓
Stream Response Chunks to Client (SSE format)
  ↓
Handle Tool Calls (if Claude requests them)
  - Call civicrm-tool-handler workflow
  - Return tool results to Claude
  - Continue streaming response
  ↓
Send final "done" chunk
```

**Critical requirements**:
- Keep webhook connection open for streaming
- Send SSE-formatted chunks: `data: {...}\n\n`
- Handle tool calling loop properly
- Error handling with graceful failure messages

#### Task 4: Test Workflows in n8n

**Testing checklist**:
- [ ] Test civicrm-tool-handler with sample inputs for all 4 tools
- [ ] Test vc-chatbot-knowledge with different queries
- [ ] Test vc-chatbot-stream end-to-end with manual webhook calls
- [ ] Verify SSE streaming format is correct
- [ ] Test tool calling loop (message → tool use → tool result → response)
- [ ] Test error handling (API failures, timeouts, etc.)

#### Task 5: Switch UI from Mock to Real n8n

**Update streaming client**:

In `src/lib/n8n/streaming-client.ts`:
- Change from `streamChatFromN8NMock` to `streamChatFromN8N`
- Update `.env.local` with real webhook URL and token

In `src/components/chat/chat-interface.tsx`:
```typescript
// Change this line:
import { streamChatFromN8NMock as streamChatFromN8N } from '@/lib/n8n/streaming-client';

// To this:
import { streamChatFromN8N } from '@/lib/n8n/streaming-client';
```

#### Task 6: End-to-End Integration Testing

**Test scenarios**:
1. Simple question (knowledge base only)
   - "What services does MAS provide?"
   - Expected: Response with MAS services info

2. Contact search
   - "Find contacts named John Smith"
   - Expected: Tool call → CiviCRM search → structured results

3. Case lookup
   - "Show me cases for contact ID 123"
   - Expected: Tool call → CiviCRM case search → case details

4. Complex query (knowledge + tools)
   - "What does MAS do and show me John Smith's cases"
   - Expected: Knowledge retrieval + contact search + case search

5. Error handling
   - Invalid contact ID
   - API timeout
   - Malformed query

#### Task 7: Polish and Optimize

**UI improvements**:
- [ ] Show tool calls in message metadata (already in UI design)
- [ ] Add "typing" indicator during knowledge retrieval
- [ ] Improve error messages
- [ ] Add retry logic for failed API calls

**Performance optimizations**:
- [ ] Cache knowledge base responses in n8n
- [ ] Add rate limiting to prevent abuse
- [ ] Monitor Claude API token usage

**Documentation**:
- [ ] Update TESTING_GUIDE.md with real n8n testing steps
- [ ] Document n8n workflow structure
- [ ] Add troubleshooting guide for common issues

---

## 🎯 Success Criteria

Before declaring Phase 2 complete:

- [ ] All 3 n8n workflows created and tested
- [ ] Chat UI successfully connects to n8n webhook
- [ ] Streaming responses display in real-time
- [ ] All 4 CiviCRM tools work correctly
- [ ] Knowledge base returns relevant content
- [ ] Messages persist to database
- [ ] Error handling works gracefully
- [ ] End-to-end testing passes all scenarios

---

## Quick Reference

### Key Files (Already Created)

**Core Files**:
- ✅ `src/lib/n8n/streaming-client.ts` - SSE client with mock and real functions
- ✅ `src/lib/n8n/types.ts` - TypeScript types
- ✅ `src/lib/db/schema.ts` - Database schema
- ✅ `src/lib/db/queries.ts` - Database helpers
- ✅ `src/lib/db/migrate.ts` - Migration runner

**Components**:
- ✅ `src/components/chat/message.tsx` - Single message
- ✅ `src/components/chat/message-list.tsx` - Message list with auto-scroll
- ✅ `src/components/chat/message-input.tsx` - Input with auto-focus
- ✅ `src/components/chat/chat-interface.tsx` - Main orchestration

**Routes**:
- ✅ `src/app/(chat)/layout.tsx` - Chat layout
- ✅ `src/app/(chat)/page.tsx` - Chat home
- ✅ `src/app/(chat)/chat/[id]/page.tsx` - Individual chat
- ✅ `src/app/(chat)/chat/[id]/actions.ts` - Server actions
- ✅ `src/app/api/messages/route.ts` - API route

### Commands

```bash
# Development (starts on port 3003, auto-starts Docker Postgres)
npm run dev

# Database management
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations

# Build (runs migrations automatically)
npm run build

# Testing
# See /docs/TESTING_GUIDE.md for testing with mock data
```

### Environment Variables

**Current setup** (`.env.local`):
```env
# Database (Local Docker Postgres)
POSTGRES_URL=postgresql://username:password@localhost:5432/vc_chatbot

# n8n Integration (Bearer token auth)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.masadvise.org/webhook/vc-chat-stream
NEXT_PUBLIC_N8N_WEBHOOK_TOKEN=your-bearer-token-here
```

**Note**: Update `NEXT_PUBLIC_N8N_WEBHOOK_TOKEN` after creating n8n webhook.

---

**Current Status**: Phase 1 Complete ✅
**Next Milestone**: Complete n8n workflows (Phase 2)
**Documentation**: See `/docs/TESTING_GUIDE.md` for testing instructions
