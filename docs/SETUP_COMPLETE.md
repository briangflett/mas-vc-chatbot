# ✅ MAS VC Chatbot - Local Development Setup Complete!

**Date**: 2026-01-17
**Status**: Ready for development

---

## What We Built

### 1. ✅ Database Setup
- **Environment**: Docker Desktop with WSL2 integration
- **Container**: `dev-postgres` (must be running for development)
- **Created**: `vc_chatbot` database in Docker Postgres container
- **Tables**: User, Chat, Message (all migrated successfully)
- **Connection**: `postgresql://username:password@localhost:5432/vc_chatbot`
- **Auto-start**: The `predev` script automatically starts the container when running `npm run dev`

### 2. ✅ Dependencies Installed
**Core**:
- `drizzle-orm` + `postgres` (database)
- `drizzle-kit` + `tsx` (migrations)

**UI**:
- `nanoid`, `date-fns`, `zod`, `lucide-react`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `framer-motion`, `sonner`
- `tailwindcss-animate`

**shadcn/ui components**:
- button, input, textarea, card, scroll-area

**What we DIDN'T install** (by design):
- ❌ `ai` (AI SDK) - not needed, n8n handles AI
- ❌ `@ai-sdk/anthropic` - not needed, n8n calls Claude
- ❌ `@ai-sdk/react` - not needed, n8n streams

### 3. ✅ Environment Variables
- `.env.local` created with database connection
- `.env.example` created for version control
- n8n webhook authentication configured (Bearer token pattern, same as npaiadvisor)
- Ready for n8n webhook integration

### 4. ✅ Drizzle ORM Configured
- Schema: `lib/db/schema.ts` (User, Chat, Message)
- Config: `drizzle.config.ts`
- Migration scripts: `lib/db/migrate.ts`
- Initial migration generated and applied

### 5. ✅ Development Server Tested
- Next.js 16 running on port 3000
- Tailwind CSS 4 configured
- shadcn/ui ready to use

---

## What's Next

### Immediate Next Steps (When Ready to Code)

**1. Create SSE Client for n8n**
- File: `lib/n8n/streaming-client.ts`
- Purpose: Receive streaming responses from n8n
- Reference: See NEXT_STEPS.md Step 5

**2. Create Chat UI Components**
- `components/chat/message-list.tsx`
- `components/chat/message-input.tsx`
- `components/chat/chat-interface.tsx`
- Reference mas-ai-chatbot for patterns (simplified)

**3. Create Chat Routes**
- `src/app/(chat)/layout.tsx`
- `src/app/(chat)/page.tsx` (chat list)
- `src/app/(chat)/chat/[id]/page.tsx` (individual chat)
- `src/app/(chat)/chat/[id]/actions.ts` (database operations)

**4. Build n8n Workflows**
- See: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/docs/N8N_WORKFLOWS.md`
- Build in n8n UI: https://n8n.masadvise.org
- Export to `/home/brian/workspace/workflows/personal/mas-vc-chatbot/workflows/`

---

## Quick Commands

```bash
# Start dev server (automatically starts dev-postgres container via predev script)
npm run dev

# Generate new migration after schema changes
npm run db:generate

# Run migrations
POSTGRES_URL=postgresql://username:password@localhost:5432/vc_chatbot npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# View database tables
docker exec dev-postgres psql -U brian -d vc_chatbot -c "\dt"

# View data in tables
docker exec dev-postgres psql -U brian -d vc_chatbot -c "SELECT * FROM \"User\";"
```

---

## Project Structure

```
mas-vc-chatbot/
├── lib/
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   ├── schema.ts          # Tables: User, Chat, Message
│   │   ├── migrate.ts         # Migration runner
│   │   └── migrations/        # Generated SQL migrations
│   ├── n8n/                   # (to create)
│   │   └── streaming-client.ts
│   └── utils.ts               # shadcn/ui utilities
│
├── src/
│   ├── app/
│   │   ├── globals.css        # Tailwind + theme variables
│   │   ├── layout.tsx
│   │   └── page.tsx           # Default home (to replace)
│   └── components/
│       └── ui/                # shadcn/ui components
│           ├── button.tsx
│           ├── input.tsx
│           ├── textarea.tsx
│           ├── card.tsx
│           └── scroll-area.tsx
│
├── .env.local                 # Local environment variables
├── .env.example               # Template for version control
├── drizzle.config.ts          # Drizzle configuration
├── components.json            # shadcn/ui configuration
├── tailwind.config.ts         # Tailwind configuration
├── CLAUDE.md                  # Project guidance for Claude
├── NEXT_STEPS.md              # Detailed implementation guide
└── package.json               # Dependencies and scripts
```

---

## Key Architecture Points

### Remember: Next.js is SIMPLE in this project

**Next.js handles**:
- ✅ Chat UI components
- ✅ SSE client (receive streams)
- ✅ Database (save messages)
- ✅ Authentication (future)

**Next.js does NOT handle**:
- ❌ Claude API calls (n8n does this)
- ❌ Tool calling (n8n does this)
- ❌ Knowledge base (n8n does this)
- ❌ Prompt construction (n8n does this)

### Data Flow
```
User types → Next.js UI → n8n webhook → Claude API → n8n streams back → Next.js displays → Postgres saves
```

---

## Development Workflow

### For UI Changes (Local)
1. Edit components in `src/`
2. See instant updates at `http://localhost:3000`
3. Iterate quickly

### For AI Logic Changes (n8n)
1. Open https://n8n.masadvise.org
2. Edit workflow visually
3. Test in n8n
4. Export to `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`

### For Database Changes (Local)
1. Edit `lib/db/schema.ts`
2. Run `npm run db:generate`
3. Review migration in `lib/db/migrations/`
4. Run `POSTGRES_URL=... npm run db:migrate`

---

## Deployment (Future)

### Vercel Staging/Production
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   ```
   POSTGRES_URL=<vercel-postgres-url>
   N8N_WEBHOOK_URL=https://n8n.masadvise.org/webhook/vc-chat-stream
   N8N_WEBHOOK_SECRET=<same-secret-as-n8n>
   ```
3. Vercel automatically runs migrations during build
4. Same code works in both environments!

---

## Troubleshooting

### Docker not found in WSL2
```bash
# Make sure Docker Desktop is running
# Enable WSL2 integration in Docker Desktop settings:
# Settings > Resources > WSL Integration > Enable for your distro
```

### Migration fails with "POSTGRES_URL not set"
```bash
# Always run migrations with explicit env var:
POSTGRES_URL=postgresql://username:password@localhost:5432/vc_chatbot npm run db:migrate
```

### Can't connect to database
```bash
# Check Postgres is running:
docker ps | grep dev-postgres

# Test connection:
docker exec dev-postgres psql -U brian -d vc_chatbot -c "SELECT version();"
```

### Dev server errors
```bash
# Clear Next.js cache:
rm -rf .next

# Reinstall dependencies:
rm -rf node_modules package-lock.json
npm install
```

---

## Resources

- **Project Docs**: `CLAUDE.md` - Overview and architecture
- **Next Steps**: `NEXT_STEPS.md` - Detailed implementation guide
- **n8n Workflows**: `/home/brian/workspace/workflows/personal/mas-vc-chatbot/`
- **Reference UI**: `/home/brian/workspace/development/mas-ai-chatbot/` (for component patterns)

---

**Setup completed**: 2026-01-17
**Ready to build**: Chat UI and SSE client
**Next milestone**: Connect to n8n for real streaming
