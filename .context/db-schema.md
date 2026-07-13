# DB Schema (Convex)

Last updated: 2026-07-13. Source of truth: [convex/schema.ts](../convex/schema.ts) — verify there before trusting this summary.

All tables are `userId`-keyed by design (MVP is single-user/no auth, but schema is multi-user-ready).

## `users`
Founder being ghostwritten. `name`, `role`, `organization` (manual, onboarding step 1), `professionalBackground` (string, LLM-inferred, max 150 words, empty until step 2 runs), `topics` (string[], 3-4, empty until step 3), `createdAt`.

## `styleProfiles`
One per user. Index: `by_user`. `profileText` (LLM-synthesized, max 200 words, updated on every post finalize), `userWritingSample` (optional raw text), `selectedStyles` (string[], 1-2 depending on whether user wrote a sample), `sampleWritingWeight` (0.75 if user wrote a sample, else 0), `updatedAt`.

## `posts`
Indexes: `by_user`, `by_user_status`. `topic`, `userInput` (optional, empty for "surprise-me"), `mode` ("user-led" | "surprise-me"), `generatedContent` (replaced on regenerate), `regenerateNote` (optional angle comment), `finalContent` (optional, set on finalize), `status` ("draft" | "finalized" | "rejected"), `editsDiff` (optional, set on finalize), `createdAt`, `finalizedAt` (optional).

**Live functions (Build Group 2 Phase 1):** [convex/posts.ts](../convex/posts.ts) — `getPost`, `createPost`. [convex/postActions.ts](../convex/postActions.ts) — `generatePost` (Call 4). Not yet built: `getPostsByUser`, `regeneratePost`, `rejectPost`, finalize fields.

## `backgroundInputs`
Index: `by_user`. Raw LinkedIn paste (`linkedinPaste`) stored separately from the inferred summary, for reference/re-processing. `createdAt`.

## Convention
LLM calls happen only inside Convex **actions**, which query needed data, call the model, then persist via a **mutation**. Frontend calls actions/queries/mutations via `convex/react` hooks — never calls an LLM directly.
