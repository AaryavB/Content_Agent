# Todo

Last updated: 2026-07-24

## Next up: Auth E2E verify

1. Set `JWT_PRIVATE_KEY` and `JWKS` on Convex deployment (see [.context/integrations.md](integrations.md)).
2. Run `npx convex dev` (or deploy) to push schema: `users` → auth accounts, `profiles` with `ownerId`.
3. Clear old founder data in Convex dashboard if needed (pre-auth `users` rows do not auto-migrate).
4. Sign up two accounts; create a profile under each; confirm neither can see or open the other's profile.
5. Test logout, login, protected routes, and full onboarding → generate → finalize flow while authenticated.

## Then: P1 anti-slop follow-up

From [`anti-slop-spec.md`](../anti-slop-spec.md) §9 — not needed for first pass:

1. Append anti-slop rules to Call 3 (`CALL3_SYSTEM`) and Call 5 (`CALL5_SYSTEM`).
2. Add optional `slopViolationCount` field on `posts` at generation time + Convex query for zero-edit finalize rate.
3. P2: config-driven blocklist, Tier-2 heuristics, optional humanize pass.

## Production verify + quality tuning

### Netlify / production

1. Confirm `NEXT_PUBLIC_CONVEX_URL` is set in Netlify → Site settings → Environment variables (`https://impressive-wildebeest-890.convex.cloud`).
2. Redeploy and smoke-test: login → profile picker → onboarding → dashboard → generate → edit → finalize → copy → repository.

### Group 3 E2E (local or production)

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

- ~~Authentication + profile ownership~~ — Convex Auth Password provider; `profiles` table with `ownerId`; server-side ownership on all profile/post functions; `/login`, `/signup`, route protection, logout (2026-07-24).
- ~~Anti-slop output layer (P0)~~ — [`convex/lib/slopFilter.ts`](../convex/lib/slopFilter.ts) (`SLOP_INSTRUCTIONS`, `lintSlop`, `scrubHardTokens`); `CALL4_SYSTEM` hardened + repair note; `generateCleanDraft` in `postActions.ts` (1 silent retry, then scrub); Call 2 flashy/preachy voice definitions fixed. Sanity script: `scripts/verify-slop.mjs`. Deploy Convex after pull: `npx convex dev`.
- ~~Build Group 3 — backend~~ — `getFinalizedPosts`, `finalizePost`, `finalizePostAction` (Call 5)
- ~~Build Group 3 — dashboard UI~~ — Edit, Finalize, Copy, My Posts repository
- ~~Test onboarding end-to-end (Calls 1–3)~~ — verified 2026-07-17
- ~~Test post generation end-to-end (Build Group 2)~~ — verified 2026-07-17
- ~~Netlify build fix~~ — commit `convex/_generated/`, add `netlify.toml` (2026-07-17)
- ~~Update `.context/db-schema.md`~~ — synced 2026-07-24

## Housekeeping

- ~~Reconcile the mentoring/session narrative in `../../context-documents/aaryav-project-context.md`~~ — done 2026-07-13
