# Progress

Last updated: 2026-07-15 (Build Group 2 Phase 2 — regenerate, reject, surprise me)

## Done

**Build Group 1 — Foundation + Onboarding: built**
- Convex schema ([convex/schema.ts](../convex/schema.ts)): `users`, `styleProfiles`, `posts`, `backgroundInputs` — matches PRD data model exactly.
- Queries/mutations ([convex/users.ts](../convex/users.ts)): `listUsers`, `getUser`, `getStyleProfile`, `getBackgroundInput`, `createUser`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`. Validation matches spec (LinkedIn paste ≥50 chars, 3-4 topics, style-selection weight rules in [convex/lib/onboarding.ts](../convex/lib/onboarding.ts)).
- 4-step onboarding UI ([components/onboarding/](../components/onboarding/)): QuickProfile → LinkedInPaste → Topics → StyleSelection, orchestrated by [OnboardingWizard.tsx](../components/onboarding/OnboardingWizard.tsx).
- Resume-on-refresh: active `userId` cached in `localStorage` ([lib/onboardingSession.ts](../lib/onboardingSession.ts)), with one-time migration from legacy `sessionStorage`. Resume step derived in [lib/onboardingResume.ts](../lib/onboardingResume.ts).
- **Profile picker home** ([components/HomeContent.tsx](../components/HomeContent.tsx)): lists all profiles via `listUsers`, select → `/dashboard` or resume `/onboarding`, create new profile, highlights last-selected profile.
- Onboarding finish redirects to `/dashboard`. Completed onboarding revisit redirects to `/dashboard` (not dead-end `/`).
- Dashboard with no/invalid session redirects to `/` (profile picker), not `/onboarding`.

**Onboarding LLM calls (1, 2, 3) wired to real OpenRouter calls — needs end-to-end testing (see Todo)**
- [convex/lib/openrouter.ts](../convex/lib/openrouter.ts): shared `fetch`-based client (`chatCompletion`, `chatCompletionJson` with fence-strip + single retry). Plain V8 runtime, no `"use node"`, no SDK dependency.
- [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts): prompt text for calls 1-3, mirrors `../prompt-engineering.md` 1:1.
- [convex/onboardingActions.ts](../convex/onboardingActions.ts): `inferProfessionalBackground`, `generateStyleSamples`, `synthesizeStyleProfile` call OpenRouter.
- Convex deployment env vars set (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`).

**Build Group 2 — Post generation: built**
- [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts): Call 4/4a prompts (`CALL4_PARAMS`, `CALL4_SYSTEM`, `call4User()` with optional `regenerateNote`), mirrors `../prompt-engineering.md`.
- [convex/posts.ts](../convex/posts.ts): `getPostsByUser`, `getPost`, `createPost`, `regeneratePost`, `rejectPost` (draft-only validation on regenerate/reject).
- [convex/postActions.ts](../convex/postActions.ts): `generatePost` (Call 4, user-led + surprise-me), `regeneratePostAction` (Call 4a).
- `/dashboard` ([components/dashboard/DashboardContent.tsx](../components/dashboard/DashboardContent.tsx)): Generate + Surprise Me, draft card with regenerate note input, Regenerate + Reject (with confirmation). Error handling: inline errors; no post create/update on LLM failure.
- `getPostsByUser` implemented for Group 3 repository; not wired to dashboard UI yet.

**Known risk, not yet resolved:** `minimax/minimax-m3` reasoning-token truncation on tight `max_tokens` — Call 2 and Call 4/4a not yet verified end-to-end against live API.

## Not started

- **Build Group 3 — Polish, Publish + Repository**: no inline editor, finalize flow (Call 5), copy button, or post repository list (`getFinalizedPosts`).

## Git state

- Branch `staging`. See `git log` for latest commits.
