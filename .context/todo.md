# Todo

Last updated: 2026-07-15

## Next up (highest priority)

1. **Test post generation end-to-end (Build Group 2).** On `/dashboard`: Generate, Surprise Me, Regenerate (with/without note), Reject. Confirm `posts` table states (`draft`, `rejected`) and `regenerateNote` persistence. Verify Call 4/4a against live OpenRouter.

2. **Test onboarding end-to-end** (if not done yet). See [integrations.md](integrations.md) for Call 2 reasoning-token risk.

## Build Group 3 — Polish, Publish + Repository (not started)

- `finalizePost` mutation, `finalizePostAction` (LLM call 5 — style profile update on finalize).
- Inline editor, Copy-to-clipboard button, Post Repository list (`getFinalizedPosts` query).
- Full spec: `functional-requirements.md` §Build Group 3.

## Housekeeping

- ~~Reconcile the mentoring/session narrative in `../../context-documents/aaryav-project-context.md` (currently stale, stops at Session 3)~~ — done 2026-07-13, added a pointer note to this repo's `.context/` as the build-status source of truth.
