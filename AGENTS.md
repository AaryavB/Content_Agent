# content-agent

AI Ghostwriter Agent — learns a founder's writing style and generates LinkedIn posts in their voice. Aaryav's capstone build. Own git repo: https://github.com/AaryavB/Content_Agent.git (branch `staging` is the working branch).

## Stack
Next.js 15 (App Router) + React 19 + Tailwind CSS 4, Convex (schema/functions/DB), TypeScript. No LLM SDK wired in yet.

## Commands
- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run convex:dev` (or `npx convex dev`) - Deploy Convex functions (required after any `convex/` change)

## Context Docs
Reference `.context/` files when needed:

| File | Load When |
|------|-----------|
| prd.md | Understanding product requirements, scope, user stories (points to canonical `PRD.md` / `functional-requirements.md`) |
| progress.md | Checking what's built vs stubbed vs missing |
| todo.md | Picking up the next build task |
| db-schema.md | Working with Convex tables/queries/mutations |

`PRD.md` and `functional-requirements.md` at repo root remain the canonical product spec (full data model, LLM call inventory, screen specs, build-group breakdown). `.context/` files summarize current *build state* against that spec — check both.

## Key Patterns
- LLM calls are isolated in Convex **actions** (`convex/*Actions.ts`), which call an LLM then persist via a **mutation**. Frontend never calls an LLM directly — only actions/mutations/queries via Convex hooks.
- All tables are `userId`-keyed even though MVP is single-user (no auth yet) — enables a straight add-auth path later without restructuring.
- Onboarding is resumable: `userId` is cached in `sessionStorage` ([lib/onboardingSession.ts](lib/onboardingSession.ts)), and [lib/onboardingResume.ts](lib/onboardingResume.ts) derives which step to resume from based on which profile fields are populated.
- **Current LLM actions are stubs** ([convex/lib/onboarding.ts](convex/lib/onboarding.ts)) — they return templated placeholder text, not real model output. No provider is chosen yet.

---
IMPORTANT: After ANY code change, update relevant `.context/` docs to keep this system alive and accurate.
