# Progress

Last updated: 2026-07-13 (Build Group 2 Phase 1 — user-led post generation)

## Done

**Build Group 1 — Foundation + Onboarding: built**
- Convex schema ([convex/schema.ts](../convex/schema.ts)): `users`, `styleProfiles`, `posts`, `backgroundInputs` — matches PRD data model exactly.
- Queries/mutations ([convex/users.ts](../convex/users.ts)): `getUser`, `getStyleProfile`, `getBackgroundInput`, `createUser`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`. Validation matches spec (LinkedIn paste ≥50 chars, 3-4 topics, style-selection weight rules in [convex/lib/onboarding.ts](../convex/lib/onboarding.ts)).
- 4-step onboarding UI ([components/onboarding/](../components/onboarding/)): QuickProfile → LinkedInPaste → Topics → StyleSelection, orchestrated by [OnboardingWizard.tsx](../components/onboarding/OnboardingWizard.tsx).
- Resume-on-refresh: `userId` cached in `sessionStorage` ([lib/onboardingSession.ts](../lib/onboardingSession.ts)), resume step derived in [lib/onboardingResume.ts](../lib/onboardingResume.ts). Covers the "user refreshes mid-onboarding" case from functional-requirements.md.
- Onboarding finish redirects to `/dashboard` (was `/?onboarding=complete`).
- Home page ([components/HomeContent.tsx](../components/HomeContent.tsx)) links to `/onboarding`; shows "Generate posts" link when `?onboarding=complete`.

**Onboarding LLM calls (1, 2, 3) wired to real OpenRouter calls — needs end-to-end testing (see Todo)**
- [convex/lib/openrouter.ts](../convex/lib/openrouter.ts): shared `fetch`-based client (`chatCompletion`, `chatCompletionJson` with fence-strip + single retry). Plain V8 runtime, no `"use node"`, no SDK dependency.
- [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts): prompt text for calls 1-3, mirrors `../prompt-engineering.md` 1:1.
- [convex/onboardingActions.ts](../convex/onboardingActions.ts): `inferProfessionalBackground`, `generateStyleSamples`, `synthesizeStyleProfile` call OpenRouter.
- Convex deployment env vars set (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`).

**Build Group 2 Phase 1 — User-led post generation: built**
- [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts): Call 4 prompts (`CALL4_PARAMS`, `CALL4_SYSTEM`, `call4User()`), mirrors `../prompt-engineering.md`.
- [convex/posts.ts](../convex/posts.ts): `getPost` query, `createPost` mutation.
- [convex/postActions.ts](../convex/postActions.ts): `generatePost` action (LLM Call 4, user-led + surprise-me modes in action; UI only exposes user-led).
- `/dashboard` route ([app/dashboard/page.tsx](../app/dashboard/page.tsx), [components/dashboard/DashboardContent.tsx](../components/dashboard/DashboardContent.tsx)): topic + opinion form, Generate button, post display card, onboarding guard redirect.
- Error handling: inline error on LLM failure; no post row created if generation fails.

**Known risk, not yet resolved:** `minimax/minimax-m3` reasoning-token truncation on tight `max_tokens` — Call 2 and Call 4 not yet verified end-to-end against live API.

## In progress / partial

- **Build Group 2 Phase 2** (remaining Group 2): Surprise Me button, `regeneratePost` + `regeneratePostAction` (Call 4a), `rejectPost`, `getPostsByUser`, Regenerate/Reject UI on dashboard.

## Not started

- **Build Group 3 — Polish, Publish + Repository**: no inline editor, finalize flow, copy button, or post repository list. LLM call 5 not implemented.

## Git state

- Branch `staging`. See `git log` for latest commits.
