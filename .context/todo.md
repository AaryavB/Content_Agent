# Todo

Last updated: 2026-07-13

## Next up (highest priority)

1. **Test post generation end-to-end (Build Group 2 Phase 1).** Walk `/dashboard` with a user who completed onboarding: enter topic + opinion → Generate → confirm draft in UI and `posts` table (`status: "draft"`). Verify Call 4 against live OpenRouter (`reasoningEffort: "none"`, `maxTokens: 600`).

2. **Test onboarding end-to-end** (if not done yet). See [integrations.md](integrations.md) for Call 2 reasoning-token risk.

## Build Group 2 — Phase 2 (remaining post generation)

- `getPostsByUser` query; `regeneratePost` mutation, `rejectPost` mutation.
- `regeneratePostAction` (LLM call 4a) — reuses `call4User()` with `regenerateNote`.
- Dashboard UI: Surprise Me button, Regenerate + comment input, Reject with confirmation.
- Full spec: `functional-requirements.md` §Build Group 2 (items not done in Phase 1).

## Build Group 3 — Polish, Publish + Repository (not started)

- `finalizePost` mutation, `finalizePostAction` (LLM call 5 — style profile update on finalize).
- Inline editor, Copy-to-clipboard button, Post Repository list (`getFinalizedPosts` query).
- Full spec: `functional-requirements.md` §Build Group 3.

## Housekeeping

- ~~Reconcile the mentoring/session narrative in `../../context-documents/aaryav-project-context.md` (currently stale, stops at Session 3)~~ — done 2026-07-13, added a pointer note to this repo's `.context/` as the build-status source of truth.
