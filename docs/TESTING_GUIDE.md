# Testing Guide - Mock Mode

## Testing the Chat UI Without n8n

The chatbot UI can be tested with mock data before building the n8n workflows. This lets you verify:

- ✅ Message display and formatting
- ✅ Real-time streaming animation
- ✅ Input handling and submission
- ✅ Database message persistence
- ✅ Loading states and error handling

---

## Current Configuration

**Status**: 🟢 **MOCK MODE ENABLED**

The chat interface is currently using `streamChatFromN8NMock` which simulates streaming responses without requiring n8n.

**File**: `src/components/chat/chat-interface.tsx`
**Line 9**: `import { streamChatFromN8NMock as streamChatFromN8N }`

---

## How to Test

### 1. Start the Dev Server

**Option A: Using npm directly**
```bash
cd /home/brian/workspace/development/mas-vc-chatbot
npm run dev
```

**Option B: Using dev-manager.sh (Recommended)**
```bash
/home/brian/workspace/tools/scripts/dev-manager.sh start mas-vc-chatbot
```

**Option C: Web Control Panel**
- Visit http://localhost/dev-control.php
- Look for "MAS VC Chatbot" section

The dev server will automatically:
- Start the `dev-postgres` container (via predev script)
- Start Next.js on http://localhost:3003 (port 3003)

### 2. Open in Browser

Navigate to: **http://localhost:3003**

The app will automatically redirect you to a new chat with a unique ID (e.g., `/chat/abc123xyz`)

### 3. Test Different Message Types

Try these messages to see different mock responses:

#### General Message
```
Hello!
```
**Expected**: Generic mock response explaining this is a test UI

#### Contact Search
```
Find contacts named John
```
**Expected**: Mock response with 3 example contacts (John Smith, Jane Doe, Bob Johnson)

#### Case Search
```
Show me active cases
```
**Expected**: Mock response with 2 example cases (Website Migration, Database Optimization)

#### Help Request
```
What can you help me with?
```
**Expected**: Overview of chatbot capabilities

### 4. Verify Streaming Animation

Watch for:
- **Initial delay** (~500ms thinking time)
- **Word-by-word streaming** (~50ms between words)
- **Animated dots** while streaming is in progress
- **Final message** appears in message list after streaming completes

### 5. Check Database Persistence

Open a new terminal and verify messages are saved:

```bash
# Use your database password from .env.local
PGPASSWORD=your_password psql -h localhost -U brian -d vc_chatbot -c 'SELECT role, content, "createdAt" FROM "Message" ORDER BY "createdAt";'
```

You should see both user and assistant messages saved with timestamps.

### 6. Test Multiple Chats

- Open a new tab to http://localhost:3000
- Notice a new chat ID is generated
- Send messages in both tabs
- Each chat maintains its own conversation history

---

## Mock Behavior Details

### Streaming Simulation

The mock function simulates realistic streaming:
- **500ms delay** before starting (thinking time)
- **50ms per word** for streaming effect
- **300ms pause** before tool calls
- **200ms pause** before completion

### Tool Call Simulation

Messages containing "contact" or "case" will trigger a simulated tool call:
- Shows tool name (`search_contacts` or `search_cases`)
- Shows input (the user's query)
- Shows output (mock search results)

### Response Templates

Mock responses are context-aware based on keywords:
- `contact` → Returns contact search results
- `case` → Returns case search results
- `help` or `what can you` → Returns capabilities overview
- Anything else → Generic explanation about being a mock

---

## Switching to Real n8n

When you're ready to test with real n8n workflows:

### 1. Update the Import

**File**: `src/components/chat/chat-interface.tsx`

**Change line 9 from:**
```typescript
import { streamChatFromN8NMock as streamChatFromN8N } from '@/lib/n8n/streaming-client';
```

**To:**
```typescript
import { streamChatFromN8N } from '@/lib/n8n/streaming-client';
```

### 2. Verify Environment Variables

Ensure `.env.local` has correct n8n credentials:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.masadvise.org/webhook/vc-chat-stream
NEXT_PUBLIC_N8N_WEBHOOK_TOKEN=your-actual-token-here
```

### 3. Build n8n Workflows First

Before switching, ensure these workflows are built and tested:
- `vc-chatbot-stream.json` - Main SSE webhook
- `civicrm-tool-handler.json` - CiviCRM tools
- `vc-chatbot-knowledge.json` - Knowledge base

See `/home/brian/workspace/workflows/personal/mas-vc-chatbot/` for workflow development.

---

## Troubleshooting

### Messages Not Streaming

**Check**: Console for errors
**Solution**: Refresh page, ensure dev server is running

### No Response After Sending

**Check**: Browser console and network tab
**Solution**: Mock function is async - responses take 1-2 seconds

### Messages Not Saving to Database

**Check**: Postgres container status
```bash
docker ps | grep dev-postgres
```

**Solution**: Container may have stopped - restart with:
```bash
docker start dev-postgres
```

### Page Won't Load

**Check**: Dev server output for compilation errors
**Solution**: Check for TypeScript errors, restart dev server if needed

---

## What to Test

### ✅ Functional Testing

- [ ] Home page redirects to new chat
- [ ] Messages send successfully
- [ ] Responses stream word-by-word
- [ ] Multiple messages in same chat
- [ ] Message history persists after page refresh
- [ ] Multiple chats maintain separate histories
- [ ] Input disabled during streaming
- [ ] Error handling (stop dev server mid-stream)

### ✅ Visual Testing

- [ ] Messages align correctly (user right, assistant left)
- [ ] Streaming animation smooth
- [ ] Loading dots animate
- [ ] Scroll area works with many messages
- [ ] Input box resizes with content
- [ ] UI responsive on mobile widths

### ✅ Performance Testing

- [ ] Fast initial page load
- [ ] Smooth scrolling with 20+ messages
- [ ] No lag during streaming
- [ ] Database queries fast (<100ms)

---

## Next Phase

Once UI testing is complete with mock data, proceed to **Phase 2: n8n Workflow Development**

See `NEXT_STEPS.md` for detailed n8n workflow implementation guide.

---

**Last Updated**: 2026-01-18
**Mode**: Mock (Testing)
**Next**: Build n8n workflows for real AI integration
