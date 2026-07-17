# Progress

Last updated: 2026-07-17 (MVP feature-complete; Netlify deploy fixed)

## Done

**Build Group 1 — Foundation + Onboarding: built + verified**
- Convex schema ([convex/schema.ts](../convex/schema.ts)): `users`, `styleProfiles`, `posts`, `backgroundInputs` — matches PRD data model exactly.
- Queries/mutations ([convex/users.ts](../convex/users.ts)): `listUsers`, `getUser`, `getStyleProfile`, `getBackgroundInput`, `createUser`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`. Validation matches spec (LinkedIn paste ≥50 chars, 3-4 topics, style-selection weight rules in [convex/lib/onboarding.ts](../convex/lib/onboarding.ts)).
- 4-step onboarding UI ([components/onboarding/](../components/onboarding/)): QuickProfile → LinkedInPaste → Topics → StyleSelection, orchestrated by [OnboardingWizard.tsx](../components/onboarding/OnboardingWizard.tsx).
- Resume-on-refresh: active `userId` cached in `localStorage` ([lib/onboardingSession.ts](../lib/onboardingSession.ts)), with one-time migration from legacy `sessionStorage`. Resume step derived in [lib/onboardingResume.ts](../lib/onboardingResume.ts).
- **Profile picker home** ([components/HomeContent.tsx](../components/HomeContent.tsx)): lists all profiles via `listUsers`, select → `/dashboard` or resume `/onboarding`, create new profile, highlights last-selected profile.
- Onboarding finish redirects to `/dashboard`. Completed onboarding revisit redirects to `/dashboard` (not dead-end `/`).
- Dashboard with no/invalid session redirects to `/` (profile picker), not `/onboarding`.
- **Onboarding LLM calls (1, 2, 3)** — wired to OpenRouter, verified end-to-end 2026-07-17.

**Onboarding LLM infrastructure**
- [convex/lib/openrouter.ts](../convex/lib/openrouter.ts): shared `fetch`-based client (`chatCompletion`, `chatCompletionJson` with fence-strip + single retry). Plain V8 runtime, no `"use node"`, no SDK dependency.
- [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts): prompt text for calls 1-3, mirrors `../prompt-engineering.md` 1:1.
- [convex/onboardingActions.ts](../convex/onboardingActions.ts): `inferProfessionalBackground`, `generateStyleSamples`, `synthesizeStyleProfile` call OpenRouter.
- Convex deployment env vars set (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`).

**Build Group 2 — Post generation: built + verified**
- [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts): Call 4/4a prompts, mirrors `../prompt-engineering.md`.
- [convex/posts.ts](../convex/posts.ts): `getPostsByUser`, `getPost`, `createPost`, `regeneratePost`, `rejectPost`.
- [convex/postActions.ts](../convex/postActions.ts): `generatePost` (Call 4), `regeneratePostAction` (Call 4a).
- `/dashboard`: Generate + Surprise Me, draft card, Regenerate + Reject. Verified end-to-end 2026-07-17.

**Build Group 3 — Polish, Publish + Repository: built**
- [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts): Call 5 prompts (`CALL5_PARAMS`, `CALL5_SYSTEM`, `call5User()`, `parseCall5Result`).
- [convex/posts.ts](../convex/posts.ts): `getFinalizedPosts`, `finalizePost`.
- [convex/postActions.ts](../convex/postActions.ts): `finalizePostAction` — skips Call 5 when no edits; graceful degrade if `updateStyleProfile` fails after LLM succeeds.
- `/dashboard` ([components/dashboard/DashboardContent.tsx](../components/dashboard/DashboardContent.tsx)): inline Edit (Save/Cancel), Finalize with loading state, Copy on finalized draft, "My Posts" repository (preview, View Full, Copy). Amber warning on profile-update failure.

**Deployment**
- **Netlify** — frontend hosted from `master` branch. [netlify.toml](../netlify.toml) sets Node 20, `npm run build`.
- **Netlify build fix (2026-07-17)** — `convex/_generated/` committed to repo (was gitignored; Netlify couldn't resolve `@/convex/_generated/api`). Regenerate locally with `npx convex dev` or `npx convex codegen` after any `convex/` change, then commit updated bindings.
- **Runtime env on Netlify** — `NEXT_PUBLIC_CONVEX_URL` must be set in Netlify dashboard (see [integrations.md](integrations.md)).
- **Convex backend** — dev deployment `impressive-wildebeest-890` (`https://impressive-wildebeest-890.convex.cloud`). LLM env vars live on Convex deployment, not Netlify.

## Pending verification

- **Group 3 manual E2E** — see [todo.md](todo.md). Build + Convex deploy verified; live LLM finalize flow needs app walkthrough on production URL.
- **Netlify production smoke test** — confirm app loads and connects to Convex after env var is set.

## Deferred

- **LLM output quality tuning** — prompt iteration, model comparison, real founder usage cycles. Learning loop is live.

## Git state

- Branches `staging` and `master` synced (as of 2026-07-17). Repo: https://github.com/AaryavB/Content_Agent
