# Todo

Last updated: 2026-07-10

## Next up (highest priority)

1. **Prompt engineering session** — provider is decided (OpenRouter, `minimax/minimax-m3`, see prd.md), but actual prompt text for calls 1-5, token budgets, and output parsing (structured vs free text) are still open. Blocks replacing the onboarding stubs with real calls.
2. **Env vars for OpenRouter — added to `.env.local`, not yet registered with Convex.** `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are in `.env.local` (key value pending from Krishna). Convex actions run server-side on Convex's infra and do NOT read `.env.local` — these two vars also need to be set via `npx convex env set` or the Convex dashboard before any action can use them.
3. **Wire real LLM calls into Build Group 1 actions** ([convex/onboardingActions.ts](../convex/onboardingActions.ts)) — replace `stubProfessionalBackground`, `stubStyleSample`, `stubStyleProfile` with real OpenRouter calls reading `OPENROUTER_MODEL` from env (so swapping models later is a config change). No OpenRouter SDK dependency in `package.json` yet — plain `fetch` to OpenRouter's OpenAI-compatible endpoint works fine and avoids adding a dependency.

## Build Group 2 — Post Generation (not started)

- `convex/posts.ts`: queries `getPostsByUser`, `getPost`; mutations `createPost`, `regeneratePost`, `rejectPost`; actions `generatePost` (LLM call 4), `regeneratePostAction` (LLM call 4a).
- `/dashboard` route + generation form (topic + opinion input, "Surprise Me") + post display/actions (Edit, Regenerate, Reject, Finalize).
- Full spec: `functional-requirements.md` §Build Group 2.

## Build Group 3 — Polish, Publish + Repository (not started)

- `finalizePost` mutation, `finalizePostAction` (LLM call 5 — style profile update on finalize).
- Inline editor, Copy-to-clipboard button, Post Repository list (`getFinalizedPosts` query).
- Full spec: `functional-requirements.md` §Build Group 3.

## Housekeeping

- Reconcile the mentoring/session narrative in `../../context-documents/aaryav-project-context.md` (currently stale, stops at Session 3) — separate from this build-progress doc, owned by Krishna/mentoring side, not this repo.
