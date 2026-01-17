# Weavy — Local Development (Weavy Clone)

A node-based workflow editor built with Next.js + React Flow, Trigger.dev task scaffolding, Prisma for persistence, and a small demo library of workflows.

Table of Contents
- [Status & Summary](#status--summary)
- [Features](#features)
- [Local setup (safe)](#local-setup-safe)
- [Environment variables (examples)](#environment-variables-examples)
- [Key files & where to look](#key-files--where-to-look)
- [Security & git hygiene](#security--git-hygiene)
- [Common issues & troubleshooting](#common-issues--troubleshooting)
- [Next steps / Roadmap](#next-steps--roadmap)
- [License](#license)

Status & Summary
This workspace contains:
- A React Flow-based editor and UI components for workflows.
- Node components: Text, Image, LLM in [src/components/workflow/nodes](src/components/workflow/nodes).
- Prisma schema and client wrapper for Postgres persistence.
- Trigger.dev task scaffold for LLM execution in [src/trigger/llm-execute.ts](src/trigger/llm-execute.ts).
- Demo workflows in [src/lib/demoWorkflows.ts](src/lib/demoWorkflows.ts).

Features
| Area | Status |
|---|---|
| Editor (React Flow) | Implemented — see [`FlowEditor`](src/components/workflow/FlowEditor.tsx) |
| Nodes | Text, Image, LLM implemented — see [`TextNode`](src/components/workflow/nodes/TextNode.tsx), [`ImageNode`](src/components/workflow/nodes/ImageNode.tsx), [`LLMNode`](src/components/workflow/nodes/LLMNode.tsx) |
| Persistence | Prisma schema added — see [`prisma/schema.prisma`](prisma/schema.prisma) and [`src/lib/prisma.ts`](src/lib/prisma.ts) |
| Trigger tasks | LLM execute task scaffold — see [`src/trigger/llm-execute.ts`](src/trigger/llm-execute.ts) |
| Demo workflows | Library available — see [`src/lib/demoWorkflows.ts`](src/lib/demoWorkflows.ts) |

Local setup (safe)
1. Create a copy of the example env file:
```bash
cp .env.example .env.local
# Fill values in .env.local (DO NOT commit .env.local)
```

2. Install dependencies and generate Prisma client:
```bash
npm install
npx prisma generate --schema=./prisma/schema.prisma
```

3. Run migrations (Supabase/remote Postgres)
```bash
npx prisma migrate dev --name init --schema=./prisma/schema.prisma
npm run dev
```

Environment variables (examples only)
- DATABASE_URL — e.g. postgresql://USER:PASS@HOST:6543/postgres?sslmode=require
- GEMINI_API_KEY — Google / Gemini API key (if using LLM)
- TRIGGER_API_KEY — Trigger.dev API key
- NEXT_PUBLIC_TRANSLOADIT_KEY / TRANSLOADIT_SECRET — Transloadit keys
Do not commit real secrets. Use `.env.local` and add to .gitignore.

Key files & entry points
- Editor / Canvas: [`src/components/workflow/FlowEditor.tsx`](src/components/workflow/FlowEditor.tsx)
- Node components: [`src/components/workflow/nodes/TextNode.tsx`](src/components/workflow/nodes/TextNode.tsx), [`src/components/workflow/nodes/ImageNode.tsx`](src/components/workflow/nodes/ImageNode.tsx), [`src/components/workflow/nodes/LLMNode.tsx`](src/components/workflow/nodes/LLMNode.tsx)
- Prisma schema: [`prisma/schema.prisma`](prisma/schema.prisma)
- Prisma client wrapper: [`src/lib/prisma.ts`](src/lib/prisma.ts)
- DB pool helper: [`src/lib/db.ts`](src/lib/db.ts)
- Trigger task scaffold: [`src/trigger/llm-execute.ts`](src/trigger/llm-execute.ts)
- Server actions for workflows: [`src/app/actions/workflowActions.ts`](src/app/actions/workflowActions.ts)
- Demo workflows: [`src/lib/demoWorkflows.ts`](src/lib/demoWorkflows.ts)

Security & git hygiene
- Remove any tracked env with:
```bash
git rm --cached .env
git commit -m "Remove sensitive env"
git push
```
- If secrets were already pushed, remove them from history using a history rewrite tool (BFG or git filter-repo). Example BFG usage:
```bash
# Warning: rewrites history, coordinate with collaborators
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```
- Ensure `.gitignore` contains `.env` and `.env.local` (see .gitignore changes).

Common issues & troubleshooting
- Prisma client missing types in editor: run `npx prisma generate` and restart TS server.
- Hydration warnings: often caused by browser extensions mutating DOM — test in incognito. Clerk provider is moved to client wrapper: [`src/components/providers/ClientProviders.tsx`](src/components/providers/ClientProviders.tsx).
- Supabase TLS: [src/lib/db.ts](src/lib/db.ts) toggles ssl for supabase URLs.

Next steps / Roadmap
- Implement executor for DAG runs and node parallelism (`src/lib/executor.ts`).
- Add Trigger tasks for FFmpeg (video frame extraction / cropping) and Transloadit integration.
- Persist run history (Prisma models) and expose API routes under [`src/app/api`](src/app/api).

References (quick links)
- [prisma/schema.prisma](prisma/schema.prisma)
- [src/lib/prisma.ts](src/lib/prisma.ts)
- [src/lib/db.ts](src/lib/db.ts)
- [src/components/workflow/FlowEditor.tsx](src/components/workflow/FlowEditor.tsx)
- [src/components/workflow/nodes/LLMNode.tsx](src/components/workflow/nodes/LLMNode.tsx)
- [src/trigger/llm-execute.ts](src/trigger/llm-execute.ts)
- [src/lib/demoWorkflows.ts](src/lib/demoWorkflows.ts)

<!-- License
This repository does not contain a license file. Add one (e.g., MIT) if you want to allow others to use the code. -->