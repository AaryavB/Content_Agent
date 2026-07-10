# Todo

Last updated: 2026-07-10

## Next up (highest priority)

1. **Test onboarding end-to-end with real OpenRouter calls (next session).** Code is wired (see progress.md) and env vars are set on the Convex deployment, but nobody has walked the actual 4-step onboarding flow against the live API yet. Specifically verify:
   - Step 2 (background inference) returns real, sensible ≤150-word prose, not an error.
   - **Step 4 (style samples) is the highest-risk call** — see [integrations.md](integrations.md) for why (`minimax/minimax-m3` reasoning-token risk). If it fails/truncates: try (a) bump `CALL2_PARAMS.maxTokens` in `onboardingPrompts.ts` first, (b) drop `responseFormatJson` if the model handles free-form JSON-in-prose better, (c) last resort, split into fewer styles per call. Don't over-engineer until an actual failure is seen.
   - Finish onboarding → style profile synthesis produces a real, directive-style ≤200-word profile.
   - Confirm `users.professionalBackground` and the `styleProfiles` row are populated with real (non-stub) text in the Convex dashboard.

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
