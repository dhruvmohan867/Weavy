# Weavy Clone — Local Development README

Short project summary  
A Next.js + React Flow clone of Weavy. Workspace includes a client React Flow editor, node components (Text / Image / LLM), a Zustand store, Prisma schema (Postgres), Trigger task scaffolding, and demo workflows.

Status — work completed so far
| Area | Completed |
|---|---|
| Project scaffold | Next 16 app router, Tailwind, React 19 |
| Client UI | Flow canvas (dynamic import), Sidebar, Header, node components (Text, Image, LLM) |
| State | Zustand store with temporal persistence ([src/store/workflowStore.ts](src/store/workflowStore.ts)) |
| Database schema | Prisma schema added ([prisma/schema.prisma](prisma/schema.prisma)) and client wrapper ([src/lib/prisma.ts](src/lib/prisma.ts)) |
| DB helper | Postgres pool with Supabase SSL handling ([src/lib/db.ts](src/lib/db.ts)) |
| Server actions | Workflow actions scaffold: [`saveWorkflowAction`](src/app/actions/workflowActions.ts), [`loadWorkflowAction`](src/app/actions/workflowActions.ts), [`getAllWorkflowsAction`](src/app/actions/workflowActions.ts) |
| Trigger scaffolding | Trigger client/task exports ([src/trigger/client.ts](src/trigger/client.ts)), LLM execute scaffold ([src/trigger/llm-execute.ts](src/trigger/llm-execute.ts)) |
| Demo content | Demo workflows ([src/lib/demoWorkflows.ts](src/lib/demoWorkflows.ts)) |
| Hydration fixes | Clerk moved into client wrapper ([src/components/providers/ClientProviders.tsx](src/components/providers/ClientProviders.tsx)), layout adjusted ([src/app/layout.tsx](src/app/layout.tsx)) |

Quick start — local (using Supabase or any Postgres)
1. Create a Supabase project and copy the Transaction Pooler connection string.
2. Add .env.local at repo root:
| Variable | Example |
|---|---|
| DATABASE_URL | postgresql://<USER>:<PASS>@<HOST>:6543/postgres?sslmode=require |
| GEMINI_API_KEY | (optional) |
| TRIGGER_API_KEY | (optional) |
| NEXT_PUBLIC_TRANSLOADIT_KEY | (optional) |

3. Install deps, generate Prisma client, run migration:
```bash
# filepath: (run in repo root)
npm install
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate dev --name init --schema=./prisma/schema.prisma
npm run dev