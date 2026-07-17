# AI Ghostwriter Agent — Project Summary

**Last updated:** 2026-07-17 (plan revised after Groups 1–2 E2E verification)  
**Repo:** [Content_Agent](https://github.com/AaryavB/Content_Agent.git) (working branch: `staging`)  
**Author:** Aaryav (capstone build)

---

## What This Is

An AI Ghostwriter Agent that learns a founder's identity, writing style, topics, and preferences to generate LinkedIn posts in their voice. The MVP is a single-user tool operated by a ghostwriter for one founder, with a data model designed for multi-user/SaaS later.

The product follows a 3-step flow:

1. **Onboarding** — capture profile, infer background from LinkedIn paste, pick topics, learn writing style via interactive sample selection
2. **Generate** — user-led or "Surprise Me" post generation, with regenerate and reject
3. **Polish & Publish** — inline edit, finalize (triggers style learning), copy to clipboard, post repository

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS 4 |
| Backend + DB | Convex (schema, queries, mutations, actions) |
| Language | TypeScript |
| LLM | OpenRouter (`minimax/minimax-m3` via plain `fetch`, no SDK) |

**Architecture pattern:** All LLM calls live in Convex **actions**. Each action queries data, calls the model, then persists via a **mutation**. The frontend never calls an LLM directly — only Convex hooks.

---

## Documentation & Planning (Done)

| Document | Purpose |
|---|---|
| `PRD.md` | Canonical product spec — problem, 3-step flow, MVP scope, data model, LLM call inventory, user stories |
| `functional-requirements.md` | Implementation spec — schema, functions, screen specs, data flows, grouped into 3 build groups |
| `prompt-engineering.md` | Draft prompt text for all 5 LLM calls |
| `product-overview.html` | Interactive visual product overview |
| `AGENTS.md` / `CLAUDE.md` | Agent context and build conventions |
| `.context/` | Living build-state docs (`progress.md`, `todo.md`, `db-schema.md`, `integrations.md`) |

---

## Build Progress Overview

| Build Group | Scope | Status |
|---|---|---|
| **Group 1** | Foundation + Onboarding | **Built + verified** |
| **Group 2** | Post Generation (dashboard, generate, regenerate, reject) | **Built + verified** |
| **Group 3** | Polish, Publish + Repository (edit, finalize, copy, history) | **Built** |

**MVP completion estimate:** ~95% feature-complete. All three build groups shipped; Group 3 E2E walkthrough and quality tuning remain.

---

## What Has Been Built

### 1. Project Foundation

- Next.js 15 app scaffolded with App Router, TypeScript, Tailwind CSS 4
- Convex backend initialized with full schema matching the PRD data model
- `ConvexClientProvider` wired in root layout
- Agent context system (`.context/` + `AGENTS.md`) for tracking build state across sessions

### 2. Convex Schema (`convex/schema.ts`)

Four tables, all `userId`-keyed for future multi-user support:

| Table | Purpose |
|---|---|
| `users` | Founder profile — name, role, org, inferred background, topics |
| `styleProfiles` | Writing style profile — synthesized text, selected styles, optional user sample, weight |
| `posts` | Generated posts — content, mode, status (`draft` / `finalized` / `rejected`), regenerate notes |
| `backgroundInputs` | Raw LinkedIn paste stored separately from inferred summary |

### 3. Convex Functions

**Users (`convex/users.ts`)**
- Queries: `listUsers`, `getUser`, `getStyleProfile`, `getBackgroundInput`
- Mutations: `createUser`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`
- Validation: LinkedIn paste ≥50 chars, 3–4 topics, style-selection weight rules (`convex/lib/onboarding.ts`)

**Onboarding actions (`convex/onboardingActions.ts`)**
- `inferProfessionalBackground` — LLM Call 1
- `generateStyleSamples` — LLM Call 2 (5 style samples as JSON)
- `synthesizeStyleProfile` — LLM Call 3

**Posts (`convex/posts.ts`)**
- Queries: `getPostsByUser`, `getPost`
- Mutations: `createPost`, `regeneratePost`, `rejectPost`

**Post actions (`convex/postActions.ts`)**
- `generatePost` — LLM Call 4 (user-led + surprise-me modes)
- `regeneratePostAction` — LLM Call 4a (with optional angle comment)

### 4. LLM Integration (`convex/lib/openrouter.ts`)

- Plain `fetch` client for OpenRouter's OpenAI-compatible API
- `chatCompletion` for plain-text responses
- `chatCompletionJson` with fence-stripping and single retry on parse failure
- Runs on default Convex V8 runtime (no `"use node"`, no SDK)
- Prompts in `convex/lib/onboardingPrompts.ts` (Calls 1–3) and `convex/lib/postPrompts.ts` (Calls 4/4a), mirroring `prompt-engineering.md`
- Model read from `OPENROUTER_MODEL` env var (not hardcoded)

### 5. Onboarding UI (4-step wizard)

**Route:** `/onboarding`  
**Components:** `components/onboarding/`

| Step | Screen | What it does |
|---|---|---|
| 1 | Quick Profile | Name, role, organization → `createUser` |
| 2 | LinkedIn Paste | Paste employment history → Call 1 infers background |
| 3 | Topics | Pick 3–4 topics → `updateTopics` |
| 4 | Style Selection | 5 generated style samples on first topic → user picks 1–2 styles, optionally writes own sample → Call 3 synthesizes profile |

**Resume behavior:** Active `userId` cached in `localStorage` (`lib/onboardingSession.ts`). Resume step derived from which profile fields are populated (`lib/onboardingResume.ts`). Completed onboarding redirects to `/dashboard`.

### 6. Profile Picker Home

**Route:** `/`  
**Component:** `components/HomeContent.tsx`

- Lists all profiles via `listUsers` (newest first)
- Select profile → `/dashboard`
- Resume incomplete profile → `/onboarding`
- Create new profile
- Highlights last-selected profile

### 7. Dashboard (Post Generation)

**Route:** `/dashboard`  
**Component:** `components/dashboard/DashboardContent.tsx`

- **Generate** — topic + optional opinion input → user-led post (Call 4)
- **Surprise Me** — random topic from user's list → agent-led post
- **Draft card** — displays generated content
- **Regenerate** — optional angle comment → Call 4a replaces draft
- **Reject** — confirmation → marks post `rejected`, clears display
- Expectation messaging: *"The agent gets better after 5-6 finalized posts"*
- Error handling: inline errors; no post create/update on LLM failure
- Redirects to `/` (profile picker) if no valid session; redirects to `/onboarding` if profile incomplete

### 8. Bug Fixes & Polish Applied

- Fixed onboarding LLM calls failing on `minimax-m3` reasoning token budget (raised `max_tokens`, set `reasoning.effort: "none"`)
- Fixed dashboard redirect bounce (don't clear stored `userId` before navigating to `/dashboard`)
- Migrated session storage from `sessionStorage` to `localStorage` for persistence across tabs

---

## What Has NOT Been Built Yet (Build Group 3)

| Feature | Spec reference |
|---|---|
| Inline editor for draft posts | `functional-requirements.md` §3.3 |
| Finalize flow + LLM Call 5 (style profile update on finalize) | `finalizePost` mutation, `finalizePostAction` |
| Copy-to-clipboard button on finalized posts | Dashboard Section B |
| Post repository list (`getFinalizedPosts` query) | Separate tab/section on dashboard |
| Edit button → toggle inline edit mode | Group 3 screen spec |

Until Group 3 is built, the learning loop (style profile improving with each finalized post) does not run.

---

## LLM Call Status

| Call | When | Status |
|---|---|---|
| 1. Background inference | Onboarding step 2 | **Verified** — quality tuning deferred |
| 2. Style sample generation | Onboarding step 4 | **Verified** — quality tuning deferred |
| 3. Style profile synthesis | Onboarding finish | **Verified** — quality tuning deferred |
| 4. Post generation | Dashboard Generate / Surprise Me | **Verified** — quality tuning deferred |
| 4a. Regenerate | Dashboard Regenerate | **Verified** — quality tuning deferred |
| 5. Style profile update | On finalize | **Built** — needs manual E2E verify |

---

## Known Risks & Open Items

1. **Output quality not yet tuned** — Calls 1–4a work functionally but prompts/model choice will be iterated after Group 3 (learning loop must exist first).
2. **`minimax/minimax-m3` reasoning tokens** — Token budgets were raised and `reasoning.effort: "none"` was set; no truncation observed in E2E testing. Revisit if quality tuning pushes longer outputs.
3. **Dual env var setup** — OpenRouter credentials must be set in both `.env.local` (Next.js/CLI) and Convex deployment env (`npx convex env set`). Convex does not read `.env.local`.
4. **Stale context doc** — `.context/db-schema.md` lags behind `progress.md` on post functions; `convex/schema.ts` is the source of truth for schema.

---

## How to Run

```bash
npm install
npm run dev          # Next.js dev server
npm run convex:dev   # Deploy Convex functions (required after any convex/ change)
```

**Env vars required:**
- `.env.local`: `CONVEX_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- Convex deployment: `npx convex env set OPENROUTER_API_KEY <key>` and `OPENROUTER_MODEL minimax/minimax-m3`

---

## App Routes

| Route | Screen |
|---|---|
| `/` | Profile picker home |
| `/onboarding` | 4-step onboarding wizard |
| `/dashboard` | Post generation + draft actions |

---

## Git History (Key Commits)

| Commit | What |
|---|---|
| `033bf58` | Initial PRD |
| `c319ad4` | Restructure PRD with MVP scope, data model, functional requirements |
| `170c205` | Interactive visual product overview HTML |
| `8028455` | Add AGENTS.md and CLAUDE.md |
| `a1f4a31` | Set up Next.js app and Convex schema foundation |
| `dc49735` | Complete Build Group 1 onboarding with Convex backend and 4-step UI |
| `ce8fd48` | Add `.context/` system and update AGENTS.md |
| `b48564c` | Wire onboarding LLM calls (1–3) to real OpenRouter calls |
| `ddedc8b` | Reconcile context docs, add integrations.md |
| `c31b529` | Fix onboarding LLM calls failing on minimax-m3 reasoning token budget |
| `91d253c` | Add Build Group 2 Phase 1 user-led post generation with dashboard |
| `4749adc` | Fix dashboard redirect bounce |
| `36b3252` | Add profile picker home and complete Build Group 2 post actions |

---

## File Structure (Key Paths)

```
├── app/
│   ├── page.tsx              # Profile picker home
│   ├── onboarding/page.tsx   # Onboarding wizard
│   └── dashboard/page.tsx    # Post generation dashboard
├── components/
│   ├── HomeContent.tsx
│   ├── onboarding/           # 4-step wizard components
│   └── dashboard/            # DashboardContent.tsx
├── convex/
│   ├── schema.ts             # Full data model
│   ├── users.ts              # User queries/mutations
│   ├── posts.ts              # Post queries/mutations
│   ├── onboardingActions.ts  # LLM Calls 1–3
│   ├── postActions.ts        # LLM Calls 4/4a
│   └── lib/
│       ├── openrouter.ts     # OpenRouter client
│       ├── onboarding.ts     # Validation + style labels
│       ├── onboardingPrompts.ts
│       └── postPrompts.ts
├── lib/
│   ├── onboardingSession.ts  # localStorage userId cache
│   └── onboardingResume.ts   # Resume step derivation
├── .context/                 # Living build-state docs
├── PRD.md                    # Canonical product spec
├── functional-requirements.md
└── prompt-engineering.md
```

---

## Next Steps (from `.context/todo.md`)

### Now: Group 3 E2E + quality tuning

1. **Manual E2E** — edit → finalize → copy → repository; no-edit finalize; regenerate then finalize
2. **Quality tuning** — prompt pass (Calls 1–5), model evaluation, 5–6 real finalize cycles

---

*For live build status, see `.context/progress.md` and `.context/todo.md`. For schema details, see `convex/schema.ts`.*
