# DB Schema (Convex)

Last updated: 2026-07-24. Source of truth: [convex/schema.ts](../convex/schema.ts) — verify there before trusting this summary.

**Auth model:** Convex Auth account rows live in `users` (from `authTables`). Founder profiles are in `profiles`, each owned by one account via `ownerId`. Related tables still use field name `userId` but it references `Id<"profiles">`.

## `users` (Convex Auth accounts)

Managed by `@convex-dev/auth` via `authTables`. Email/password sign-up creates rows here only — **not** a founder profile. Do not add custom founder fields to this table.

## `profiles`
Founder being ghostwritten. `ownerId` → `users` (authenticated account). `name`, `role`, `organization` (manual, onboarding step 1), `professionalBackground` (string, LLM-inferred, max 150 words, empty until step 2 runs), `topics` (string[], 3-4, empty until step 3), `createdAt`. Index: `by_owner`.

**Functions:** [convex/profiles.ts](../convex/profiles.ts)
- Queries: `listProfiles`, `getProfile`, `getStyleProfile`, `getBackgroundInput`
- Mutations: `createProfile`, `saveBackgroundInput`, `updateProfessionalBackground`, `updateTopics`, `createStyleProfile`, `updateStyleProfile`

All profile-scoped functions require authentication and verify `profiles.ownerId` matches the logged-in account.

## `styleProfiles`
One per profile. Index: `by_user` (`userId` → `profiles`). `profileText` (LLM-synthesized, max 200 words, updated on finalize via Call 5), `userWritingSample` (optional raw text), `selectedStyles` (string[], 1-2 depending on whether user wrote a sample), `sampleWritingWeight` (0.75 if user wrote a sample, else 0), `updatedAt`.

## `posts`
Indexes: `by_user`, `by_user_status` (`userId` → `profiles`). `topic`, `userInput` (optional, empty for "surprise-me"), `mode` ("user-led" | "surprise-me"), `generatedContent` (replaced on regenerate), `regenerateNote` (optional angle comment), `finalContent` (optional, set on finalize), `status` ("draft" | "finalized" | "rejected"), `editsDiff` (optional, set on finalize when user edited), `createdAt`, `finalizedAt` (optional).

**Functions:** [convex/posts.ts](../convex/posts.ts)
- Queries: `getPostsByUser`, `getFinalizedPosts`, `getPost`
- Mutations: `createPost`, `regeneratePost`, `rejectPost`, `finalizePost`

**Actions:** [convex/postActions.ts](../convex/postActions.ts)
- `generatePost` (Call 4), `regeneratePostAction` (Call 4a), `finalizePostAction` (Call 5)

Draft-only mutations (`regeneratePost`, `rejectPost`, `finalizePost`) validate `status === "draft"` via `assertDraftPost`. All post access checks ownership via the post's `userId` profile.

## `backgroundInputs`
Index: `by_user` (`userId` → `profiles`). Raw LinkedIn paste (`linkedinPaste`) stored separately from the inferred summary, for reference/re-processing. `createdAt`.

## Auth tables (Convex Auth)

From `authTables`: `authSessions`, `authAccounts`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits`. Configured in [convex/auth.ts](../convex/auth.ts) with Password provider only.

## Convention
LLM calls happen only inside Convex **actions**, which query needed data, call the model, then persist via a **mutation**. Frontend calls actions/queries/mutations via `convex/react` hooks — never calls an LLM directly.

## Generated bindings
[convex/_generated/](../convex/_generated/) — auto-generated API types. **Committed to git** for Netlify/CI builds. Regenerate with `npx convex codegen` after schema or function changes.
