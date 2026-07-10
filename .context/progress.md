# Progress

Last updated: 2026-07-10 (verified against code, branch `staging` @ dc49735)

## Done

**Build Group 1 — Foundation + Onboarding: built**
- Convex schema ([convex/schema.ts](../convex/schema.ts)): `users`, `styleProfiles`, `posts`, `backgroundInputs` — matches PRD data model exactly.
- Queries/mutations ([convex/users.ts](../convex/users.ts)): `getUser`, `getStyleProfile`, `getBackgroundInput`, `createUser`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`. Validation matches spec (LinkedIn paste ≥50 chars, 3-4 topics, style-selection weight rules in [convex/lib/onboarding.ts](../convex/lib/onboarding.ts)).
- 4-step onboarding UI ([components/onboarding/](../components/onboarding/)): QuickProfile → LinkedInPaste → Topics → StyleSelection, orchestrated by [OnboardingWizard.tsx](../components/onboarding/OnboardingWizard.tsx).
- Resume-on-refresh: `userId` cached in `sessionStorage` ([lib/onboardingSession.ts](../lib/onboardingSession.ts)), resume step derived in [lib/onboardingResume.ts](../lib/onboardingResume.ts). Covers the "user refreshes mid-onboarding" case from functional-requirements.md.
- Home page ([components/HomeContent.tsx](../components/HomeContent.tsx)) links to `/onboarding`, shows a completion banner via `?onboarding=complete`.

## Partial / stubbed — not real yet

- **All 3 onboarding LLM calls are stubs**, not real model calls ([convex/lib/onboarding.ts](../convex/lib/onboarding.ts)): `stubProfessionalBackground`, `stubStyleSample`, `stubStyleProfile` return templated placeholder text. Wired correctly (action → mutation → DB), but no model is actually called.
- No LLM SDK dependency in `package.json` (no `openai`, `@anthropic-ai/sdk`, `ai`, etc.). Provider/model choice is unresolved.

## Not started

- **Build Group 2 — Post Generation**: no `convex/posts.ts`, no `/dashboard` route, no generate/regenerate/reject UI. LLM calls 4 & 4a not implemented.
- **Build Group 3 — Polish, Publish + Repository**: no inline editor, finalize flow, copy button, or post repository list. LLM call 5 not implemented.
- Prompt engineering session (actual prompt text, system vs user prompts, token budgets, output parsing) — explicitly deferred per `functional-requirements.md`.

## Git state

- Branch `staging`, tracks `origin/staging`, clean working tree as of last pull.
- 6 commits total: PRD → PRD restructure → product overview HTML → AGENTS/CLAUDE.md → Next.js+Convex schema scaffold → Build Group 1 complete (`dc49735`).
- Commits arrived as a single squashed push covering what was apparently several build sessions — no per-session commit granularity to reconstruct exact session boundaries from git history alone.
