# Todo

Last updated: 2026-07-17

## Next up (highest priority): Quality tuning + Group 3 E2E verification

Build Group 3 is **built** (2026-07-17). Run the manual E2E checklist in the app before treating MVP as done:

1. Generate draft → Edit → Save → Finalize → Copy → confirm post in repository
2. Finalize without edits — post finalized, no style profile update
3. Regenerate then finalize — Call 5 compares against latest `generatedContent`
4. Reject still works; new generation after finalize resets draft card
5. Qualitative: finalize 1–2 edited posts, generate again, note style influence

## Quality tuning (post-MVP feature-complete)

- Prompt engineering pass across Calls 1–5 (`prompt-engineering.md` + live output review)
- Model evaluation — try alternatives via `OPENROUTER_MODEL` if `minimax/minimax-m3` quality plateaus
- Token budget tuning only if truncation resurfaces under heavier prompts
- Real founder usage: 5–6 finalize cycles to validate the "agent gets better" expectation

## Done

- ~~Build Group 3 — backend~~ — `getFinalizedPosts`, `finalizePost`, `finalizePostAction` (Call 5)
- ~~Build Group 3 — dashboard UI~~ — Edit, Finalize, Copy, My Posts repository
- ~~Test onboarding end-to-end (Calls 1–3)~~ — verified 2026-07-17
- ~~Test post generation end-to-end (Build Group 2)~~ — verified 2026-07-17

## Housekeeping

- ~~Reconcile the mentoring/session narrative in `../../context-documents/aaryav-project-context.md`~~ — done 2026-07-13
- Update `.context/db-schema.md` to match current post functions (lags `progress.md`)
