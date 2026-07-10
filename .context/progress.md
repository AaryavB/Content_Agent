# Progress

Last updated: 2026-07-10 (verified against code, branch `staging`, post-OpenRouter-wiring)

## Done

**Build Group 1 — Foundation + Onboarding: built**
- Convex schema ([convex/schema.ts](../convex/schema.ts)): `users`, `styleProfiles`, `posts`, `backgroundInputs` — matches PRD data model exactly.
- Queries/mutations ([convex/users.ts](../convex/users.ts)): `getUser`, `getStyleProfile`, `getBackgroundInput`, `createUser`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`. Validation matches spec (LinkedIn paste ≥50 chars, 3-4 topics, style-selection weight rules in [convex/lib/onboarding.ts](../convex/lib/onboarding.ts)).
- 4-step onboarding UI ([components/onboarding/](../components/onboarding/)): QuickProfile → LinkedInPaste → Topics → StyleSelection, orchestrated by [OnboardingWizard.tsx](../components/onboarding/OnboardingWizard.tsx).
- Resume-on-refresh: `userId` cached in `sessionStorage` ([lib/onboardingSession.ts](../lib/onboardingSession.ts)), resume step derived in [lib/onboardingResume.ts](../lib/onboardingResume.ts). Covers the "user refreshes mid-onboarding" case from functional-requirements.md.
- Home page ([components/HomeContent.tsx](../components/HomeContent.tsx)) links to `/onboarding`, shows a completion banner via `?onboarding=complete`.

**Onboarding LLM calls (1, 2, 3) wired to real OpenRouter calls — needs end-to-end testing (see Todo)**
- New [convex/lib/openrouter.ts](../convex/lib/openrouter.ts): shared `fetch`-based client (`chatCompletion`, `chatCompletionJson` with fence-strip + single retry). Plain V8 runtime, no `"use node"`, no SDK dependency.
- New [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts): prompt text for calls 1-3, mirrors `../prompt-engineering.md` 1:1.
- [convex/onboardingActions.ts](../convex/onboardingActions.ts) rewritten: `inferProfessionalBackground`, `generateStyleSamples`, `synthesizeStyleProfile` now call OpenRouter instead of the stubs. Stubs removed from `convex/lib/onboarding.ts`.
- Convex deployment env vars **set** (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL=minimax/minimax-m3` via `npx convex env set`) — confirmed present via `npx convex env list`.
- `npx convex dev --once` compiles/deploys clean; `npx tsc --noEmit` passes.
- `npm install` was required (node_modules was missing) — done.

**Known risk, not yet resolved:** `minimax/minimax-m3` is a reasoning model — a quick manual OpenRouter test showed it can return `content: null` (all budget spent on hidden reasoning tokens) when `max_tokens` is too tight, with `finish_reason: "length"`. A follow-up test with realistic Call-1-sized params returned real content fine, but **Call 2 (5 style samples, JSON, max_tokens 700) was not yet verified against the live API** — reasoning tokens + 5 paragraphs of JSON could still truncate mid-JSON and fail to parse even after the built-in retry. Needs live testing before trusting onboarding end-to-end.

## Not started

- **Build Group 2 — Post Generation**: no `convex/posts.ts`, no `/dashboard` route, no generate/regenerate/reject UI. LLM calls 4 & 4a not implemented.
- **Build Group 3 — Polish, Publish + Repository**: no inline editor, finalize flow, copy button, or post repository list. LLM call 5 not implemented.
- Prompt engineering session (actual prompt text, system vs user prompts, token budgets, output parsing) — explicitly deferred per `functional-requirements.md`.

## Git state

- Branch `staging`, tracks `origin/staging`, clean working tree as of last pull.
- 6 commits total: PRD → PRD restructure → product overview HTML → AGENTS/CLAUDE.md → Next.js+Convex schema scaffold → Build Group 1 complete (`dc49735`).
- Commits arrived as a single squashed push covering what was apparently several build sessions — no per-session commit granularity to reconstruct exact session boundaries from git history alone.
