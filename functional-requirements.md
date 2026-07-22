# Functional Requirements

**Product:** AI Ghostwriter Agent

**Last updated:** 2026-07-17

**Purpose:** Implementation-level specifications for the MVP. Originally designed as build-session prompts grouped into 3 self-contained build groups. All three groups are now **implemented**; this document reflects the shipped app and any intentional deviations from the original spec.

**Product context:** See `PRD.md` for product overview, problem statement, MVP scope, data model summary, LLM call inventory, key constraints, and user stories.

**Live build state:** See `.context/progress.md` for verification status and open items. `convex/schema.ts` and the codebase are the source of truth when this document and progress diverge.

**Prompt note:** Prompt text lives in `convex/lib/onboardingPrompts.ts` (Calls 1–3) and `convex/lib/postPrompts.ts` (Calls 4, 4a, 5). Each LLM call section below still documents inputs, outputs, storage, and prompt coverage.

---

# 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 | `app/` routes, client components in `components/` |
| Backend + DB | Convex | Schema, queries, mutations, actions. `convex/_generated/` committed for Netlify builds. |
| Styling | Tailwind CSS 4 | Utility classes throughout UI components |
| Language | TypeScript | Shared types between frontend and Convex |
| LLM Provider | OpenRouter | OpenAI-compatible API via plain `fetch` in `convex/lib/openrouter.ts` |
| LLM Model | `OPENROUTER_MODEL` env var | Set on Convex deployment (`npx convex env set`). Not hardcoded. |
| LLM SDK | None | Default Convex V8 runtime — no `"use node"`, no provider SDK |

**Architectural pattern:** LLM calls happen inside Convex actions (server-side functions). Each action follows the pattern: query needed data from Convex, call LLM, store result via mutation. Frontend calls actions, never calls the LLM directly.

**Deployment:** Frontend on Netlify (`netlify.toml`, `master` branch). Convex backend on a separate deployment. `NEXT_PUBLIC_CONVEX_URL` on Netlify; `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` on Convex.

---

# 2. App Routes & Screens

| Route | Screen | Component | Status |
|---|---|---|---|
| `/` | Profile picker home | `components/HomeContent.tsx` | Built |
| `/onboarding` | 4-step onboarding wizard | `components/onboarding/OnboardingWizard.tsx` | Built |
| `/dashboard` | Post generation, draft actions, repository | `components/dashboard/DashboardContent.tsx` | Built |

**Session:** Active `userId` is stored in `localStorage` via `lib/onboardingSession.ts` (with one-time migration from legacy `sessionStorage`). No authentication in MVP — profile picker lists all `users` rows.

---

# 3. Implementation Status

| Build Group | Scope | Status |
|---|---|---|
| **Group 1** | Foundation + Onboarding (schema, Calls 1–3, profile picker, 4-step wizard) | **Built + verified** (E2E 2026-07-17) |
| **Group 2** | Post Generation (dashboard, generate, surprise-me, regenerate, reject; Calls 4 & 4a) | **Built + verified** (E2E 2026-07-17) |
| **Group 3** | Polish, Publish + Repository (edit, finalize, copy, history; Call 5) | **Built** — manual E2E walkthrough pending |

**Deferred (post-MVP):** Output quality tuning (prompt/model iteration), authentication, SaaS productization.

---

# 4. Functional Requirements

Functional requirements are grouped into 3 build groups. Each group specifies: Convex schema/functions, LLM call coverage, screen specs, and data flow.

---

## Build Group 1: Foundation + Onboarding

**Status:** Built + verified. Implementation: `convex/schema.ts`, `convex/users.ts`, `convex/onboardingActions.ts`, `convex/lib/onboarding.ts`, `convex/lib/onboardingPrompts.ts`, `components/onboarding/`, `components/HomeContent.tsx`, `lib/onboardingSession.ts`, `lib/onboardingResume.ts`.

### 1.1 Convex Schema

All tables defined here. This is the complete schema for the entire application. Groups 2 and 3 add functions but no new tables.

```typescript
// convex/schema.ts
import { defineTable, defineSchema } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.string(),
    organization: v.string(),
    professionalBackground: v.string(),   // LLM-generated, max 150 words
    topics: v.array(v.string()),          // 3-4 topics, flat list
    createdAt: v.number(),
  }),

  styleProfiles: defineTable({
    userId: v.id("users"),
    profileText: v.string(),              // LLM-generated, max 200 words
    userWritingSample: v.optional(v.string()),
    selectedStyles: v.array(v.string()),  // up to 2, or 1 if user wrote sample
    sampleWritingWeight: v.number(),      // 0.75 or 0
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  posts: defineTable({
    userId: v.id("users"),
    topic: v.string(),
    userInput: v.optional(v.string()),     // user's opinion/take. Empty for "surprise-me"
    mode: v.string(),                      // "user-led" or "surprise-me"
    generatedContent: v.string(),          // replaced on regenerate
    regenerateNote: v.optional(v.string()),// angle adjustment comment
    finalContent: v.optional(v.string()),  // final edited version
    status: v.string(),                    // "draft", "finalized", "rejected"
    editsDiff: v.optional(v.string()),     // summary of edits, used for style update
    createdAt: v.number(),
    finalizedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  backgroundInputs: defineTable({
    userId: v.id("users"),
    linkedinPaste: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
```

### 1.2 Convex Functions

#### Queries

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `listUsers` | none | `{ userId, name, role, organization, createdAt, hasStyleProfile }[]` | List all profiles for home-screen picker, newest first |
| `getUser` | `userId: v.id("users")` | User doc or null | Fetch user profile for onboarding/generation context |
| `getStyleProfile` | `userId: v.id("users")` | StyleProfile doc or null | Fetch active style profile |
| `getBackgroundInput` | `userId: v.id("users")` | BackgroundInput doc or null | Fetch raw LinkedIn paste (for re-processing if needed) |

#### Mutations

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `createUser` | `name, role, organization` | `userId` | Create user with 3 profile fields. `professionalBackground` initialized as empty string, `topics` as empty array. |
| `saveBackgroundInput` | `userId, linkedinPaste` | `backgroundInputId` | Store raw LinkedIn paste |
| `updateProfessionalBackground` | `userId, professionalBackground` | void | Update `users.professionalBackground` after LLM call 1 |
| `updateTopics` | `userId, topics: string[]` | void | Update `users.topics` with 3-4 topics |
| `createStyleProfile` | `userId, profileText, selectedStyles, userWritingSample?, sampleWritingWeight` | `styleProfileId` | Create initial style profile after LLM call 3 |
| `updateStyleProfile` | `userId, profileText` | void | Update style profile text (used by Group 3 on finalize) |

#### Actions (LLM calls)

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `inferProfessionalBackground` | `userId, linkedinPaste` | `{ professionalBackground: string }` | LLM Call 1. Reads paste, calls LLM, stores result via `updateProfessionalBackground` mutation, returns summary. |
| `generateStyleSamples` | `topic: string` | `{ samples: { style: string, content: string }[] }` | LLM Call 2. Takes first topic, generates 5 one-paragraph samples in 5 styles. Returns to frontend for user selection. Does NOT store anything. |
| `synthesizeStyleProfile` | `userId, selectedStyles, userWritingSample?, sampleWritingWeight` | `{ profileText: string }` | LLM Call 3. Synthesizes selections + optional writing into style profile. Stores via `createStyleProfile` mutation, returns profile text. |

### 1.3 LLM Call Coverage

#### Call 1: Background Inference

| Property | Value |
|---|---|
| Triggered by | User pasting LinkedIn text and clicking "Continue" in onboarding step 2 |
| Convex action | `inferProfessionalBackground` |
| Input | `linkedinPaste` (raw text) |
| Output | `professionalBackground` (string, max 150 words) |
| Stored in | `users.professionalBackground` |
| Prompt coverage | Extract professional background, industry, key achievements, roles, notable context. Concise summary. Exclude irrelevant personal details. Max 150 words. |
| Loading UX | Show spinner/processing state on step 2 while call runs |
| Implementation | `convex/onboardingActions.ts` → OpenRouter via `convex/lib/openrouter.ts` |

| Property | Value |
|---|---|
| Triggered by | User completing topics (step 3) and advancing to step 4 |
| Convex action | `generateStyleSamples` |
| Input | `topic` (first topic from user's list) |
| Output | 5 objects: `{ style: string, content: string }` (one paragraph each) |
| Stored in | Nothing. Returned to frontend for display only. |
| Prompt coverage | Generate 5 short one-paragraph posts on the given topic, same idea, in 5 distinct styles: contrarian, humble, flashy, preachy, conversational. Each post is one paragraph. |
| Loading UX | Show skeleton cards or spinner while samples generate. Display 5 cards when ready. |
| Implementation | `convex/onboardingActions.ts` → OpenRouter JSON response |

#### Call 3: Style Profile Synthesis

| Property | Value |
|---|---|
| Triggered by | User selecting styles (and optionally writing own sample) and clicking "Finish Onboarding" |
| Convex action | `synthesizeStyleProfile` |
| Input | `selectedStyles` (up to 2, or 1 if user wrote sample), `userWritingSample` (optional), `sampleWritingWeight` (0.75 or 0) |
| Output | `profileText` (string, max 200 words) |
| Stored in | `styleProfiles` table (new doc) |
| Prompt coverage | Synthesize selected styles + optional user writing into concise style profile. Cover: tone, sentence structure, vocabulary patterns, formatting habits, thinking patterns. Weight user writing at 75% if provided. Max 200 words. |
| Loading UX | Show processing state on step 4. Redirect to `/dashboard` on completion. |
| Implementation | `convex/onboardingActions.ts` → OpenRouter via `convex/lib/openrouter.ts` |

### 1.4 Screen Spec: Home (Profile Picker)

**Route:** `/`

**Component:** `components/HomeContent.tsx`

**Layout:** Profile list as the app entry point. Page title: "Content Agent". No auth in MVP — all rows in `users` are visible to the operator.

| Element | Type | Behavior |
|---|---|---|
| Profile list | Cards from `listUsers` query | Shows name, role, organization, created date |
| Status badge | Per card | "Ready" if `hasStyleProfile`, else "Continue setup" |
| Select profile | Card click | Stores `userId` in `localStorage` ([lib/onboardingSession.ts](../lib/onboardingSession.ts)). Navigates to `/dashboard` if ready, else `/onboarding` to resume |
| Last selected | Visual highlight | Card matching stored `userId` is highlighted |
| Create new profile | Button | Clears stored `userId`, navigates to `/onboarding` step 1 (new `createUser` row) |
| Empty state | Static + button | "No profiles yet" with **Create profile** CTA |

**Data flow:** On mount, call `listUsers()`. User selects a profile or creates new. Dashboard and onboarding read active `userId` from `localStorage`. If `/dashboard` is opened with no stored ID or invalid/incomplete profile, redirect to `/`.

### 1.5 Screen Spec: Onboarding (Multi-Step Form)

**Route:** `/onboarding`

**Component:** `components/onboarding/OnboardingWizard.tsx` orchestrates step components: `StepQuickProfile`, `StepLinkedInPaste`, `StepTopics`, `StepStyleSelection`.

**Layout:** Single page, 4 sequential steps. Progress bar at top ("Step N of 4" + fill bar). No skip buttons. Each step has a primary action button that advances to the next step. Loading state shown while resuming from stored session.

#### Step 1: Quick Profile

| Element | Type | Validation | Stores To |
|---|---|---|---|
| Name | Text input | Required, non-empty | `users.name` via `createUser` |
| Role | Text input | Required, non-empty | `users.role` via `createUser` |
| Organization | Text input | Required, non-empty | `users.organization` via `createUser` |
| "Continue" button | Button | Disabled until all 3 fields filled | Calls `createUser` mutation, advances to step 2 |

**Data flow:** User fills 3 fields, clicks Continue. Frontend calls `createUser({ name, role, organization })`. Returns `userId`. Store `userId` in `localStorage` via `setStoredUserId` and in component state. Advance to step 2.

#### Step 2: Professional Background

| Element | Type | Validation | Stores To |
|---|---|---|---|
| Helper text | Static text | "Copy your LinkedIn About or Experience section and paste it here." | N/A |
| LinkedIn paste | Large textarea | Required, min 50 chars | `backgroundInputs.linkedinPaste` via `saveBackgroundInput` |
| "Continue" button | Button | Disabled until textarea has content | Calls `saveBackgroundInput`, then `inferProfessionalBackground` action |

**Data flow:** User pastes LinkedIn text, clicks Continue. Frontend calls `saveBackgroundInput({ userId, linkedinPaste })`. Then calls `inferProfessionalBackground({ userId, linkedinPaste })` action. Show loading state. Action calls LLM, stores result via `updateProfessionalBackground` mutation. On completion, advance to step 3. Optionally show the generated background summary briefly before advancing (build decision, not required).

#### Step 3: Topics

| Element | Type | Validation | Stores To |
|---|---|---|---|
| Helper text | Static text | "What topics do you usually write or think about? Add 3-4." | N/A |
| Topic inputs | 4 text inputs (or tag picker) | At least 3 required | `users.topics` via `updateTopics` |
| "Continue" button | Button | Disabled until at least 3 topics entered | Calls `updateTopics`, advances to step 4 |

**Data flow:** User enters 3-4 topics, clicks Continue. Frontend calls `updateTopics({ userId, topics })`. Advance to step 4.

#### Step 4: Style Selection

| Element | Type | Validation | Stores To |
|---|---|---|---|
| Helper text | Static text | "Here are 5 writing styles on [first topic]. Pick up to 2 that feel most like you." | N/A |
| 5 sample cards | Cards with style label + one-paragraph content | Selectable. Up to 2 if no own writing, 1 if own writing provided | N/A (selection stored in client state) |
| "Write your own" textarea | Large textarea (optional) | If user types here, selection limit drops from 2 to 1 | N/A (stored in client state) |
| "Finish Onboarding" button | Button | Disabled until at least 1 style selected. If user wrote own sample, disabled until exactly 1 style selected. | Calls `synthesizeStyleProfile` action |

**Interaction logic:**
- On step 4 mount, call `generateStyleSamples({ topic: firstTopic })`. Show loading state on cards.
- When samples return, display 5 cards with style label and content.
- User clicks cards to select/deselect. Enforce max selection based on whether own writing textarea has content.
- If user starts typing in "Write your own" textarea and has 2 styles selected, auto-deselect to 1 and lock max at 1.
- If user clears the textarea, unlock max back to 2.

**Data flow:** User selects styles and optionally writes own sample, clicks Finish. Frontend calls `synthesizeStyleProfile({ userId, selectedStyles, userWritingSample, sampleWritingWeight })`. Show loading state. Action calls LLM, stores via `createStyleProfile` mutation. On completion, redirect to `/dashboard`.

### 1.6 Error Handling (Group 1)

| Scenario | Handling |
|---|---|
| LLM call fails (any of calls 1, 2, 3) | Show inline error with message. Do not advance step. User can retry the step action. |
| User refreshes mid-onboarding | `userId` persists in `localStorage`. On mount, `OnboardingWizard` loads stored ID, fetches user + style profile, and derives resume step via `getResumeStep()` in `lib/onboardingResume.ts`: step 2 if no `professionalBackground`, step 3 if no `topics`, step 4 if no style profile, redirect to `/dashboard` if complete. |
| User opens `/onboarding` with completed profile | Redirect to `/dashboard` (not home). |
| Invalid stored `userId` (user deleted) | Clear storage, restart at step 1. |
| LinkedIn paste too short | Validation prevents submission (min 50 chars). Show inline error. |

---

## Build Group 2: Post Generation

**Status:** Built + verified. Implementation: `convex/posts.ts`, `convex/postActions.ts`, `convex/lib/postPrompts.ts`, `components/dashboard/DashboardContent.tsx`.

### 2.1 Convex Functions

#### Queries

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `getPostsByUser` | `userId: v.id("users")` | Post[] sorted by createdAt desc | Fetch all posts for dashboard display and repository |
| `getPost` | `postId: v.id("posts")` | Post doc or null | Fetch single post for editing/viewing |

#### Mutations

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `createPost` | `userId, topic, userInput?, mode, generatedContent` | `postId` | Create new post doc with status "draft" |
| `regeneratePost` | `postId, generatedContent, regenerateNote?` | void | Replace `generatedContent` and update `regenerateNote` on existing post |
| `rejectPost` | `postId` | void | Set `status` to "rejected" |

#### Actions (LLM calls)

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `generatePost` | `userId, topic, userInput?, mode` | `{ postId, generatedContent }` | LLM Call 4. Queries user profile + style profile, calls LLM, stores via `createPost` mutation. Returns post. |
| `regeneratePostAction` | `postId, regenerateNote?` | `{ generatedContent }` | LLM Call 4a. Queries post (for topic + userInput) + user profile + style profile, calls LLM with regenerate note, stores via `regeneratePost` mutation. Returns new content. |

### 2.2 LLM Call Coverage

#### Call 4: Post Generation

| Property | Value |
|---|---|
| Triggered by | User clicking "Generate" or "Surprise Me" on dashboard |
| Convex action | `generatePost` |
| Input | `userId`, `topic`, `userInput` (optional, empty for surprise-me), `mode` |
| Context pulled by action | `users` doc (name, role, organization, professionalBackground, topics) + `styleProfiles` doc (profileText) |
| Output | `generatedContent` (string, LinkedIn post with hook + body + CTA) |
| Stored in | `posts` table (new doc, status "draft") |
| Prompt coverage | Generate a LinkedIn post in the user's writing style. Use professional background for context. Post structure: hook + body + CTA. For "surprise-me" mode, pick a random angle (hot take, story, lesson learned, contrarian). Concise, platform-appropriate length. |
| Loading UX | Show generating state on button. Display post when ready. |

#### Call 4a: Regenerate

| Property | Value |
|---|---|
| Triggered by | User clicking "Regenerate" with optional comment |
| Convex action | `regeneratePostAction` |
| Input | `postId`, `regenerateNote` (optional) |
| Context pulled by action | Post doc (topic, userInput) + `users` doc + `styleProfiles` doc |
| Output | New `generatedContent` (string) |
| Stored in | Updates existing post doc. `generatedContent` is replaced. `regenerateNote` is updated. |
| Prompt coverage | Same as Call 4 but with additional regenerate note as guidance (e.g., "make it more punchy", "less humble"). |
| Loading UX | Show regenerating state. Replace post content when ready. |

### 2.3 Screen Spec: Dashboard

**Route:** `/dashboard`

**Component:** `components/dashboard/DashboardContent.tsx`

**Layout:** Three sections stacked vertically on a single page:
- **Section A:** Generation form (topic + optional take, Generate / Surprise Me)
- **Section B:** Draft card (shown after generation; edit, finalize, regenerate, reject, copy when finalized)
- **Section C:** "My Posts" repository (always visible below; finalized posts list)

**Session guard:** On mount, read `userId` from `localStorage`. If missing, invalid user, or no style profile → redirect to `/` (profile picker). Does not redirect to `/onboarding` directly.

#### Section A: Generation Form

| Element | Type | Validation | Action |
|---|---|---|---|
| Topic input | Text input | Required for "Generate", hidden/disabled for "Surprise Me" | N/A |
| Opinion/input textarea | Large textarea | Optional for "Generate", hidden for "Surprise Me" | N/A |
| "Generate" button | Primary button | Disabled until topic entered | Calls `generatePost` action with mode "user-led" |
| "Surprise Me" button | Secondary button | Disabled when user has no topics or busy | Calls `generatePost` with mode `"surprise-me"`, random topic from `users.topics`. After success, fills the topic input with the chosen topic and clears opinion input. |
| Expectation text | Static text | "The agent gets better after 5-6 finalized posts. Keep reviewing and editing." | N/A |

**"Surprise Me" flow:** Frontend picks a random topic from the user's topic list (fetched via `getUser`). Calls `generatePost({ userId, topic: randomTopic, mode: "surprise-me" })`. No topic or opinion inputs needed from user.

#### Section B: Post Display + Actions

| Element | Type | When Shown | Action |
|---|---|---|---|
| Post content card | Card displaying `generatedContent` | After generation completes | N/A |
| "Edit" button | Button | Always shown on draft posts | Toggles inline edit mode (Group 3) |
| "Regenerate" button + comment input | Button + text input (always visible on draft) | Shown on draft posts when not in edit mode | Calls `regeneratePostAction` with optional comment from input |
| "Reject" button | Destructive button | Always shown on draft posts | Calls `rejectPost` mutation, marks as rejected, clears post display |
| "Finalize" button | Primary button | Shown on draft posts (also after edit) | Triggers finalize flow (Group 3) |

**Regenerate interaction:** Regenerate guidance input is always visible below draft actions (label: "Regenerate with guidance (optional)"). User enters optional comment (e.g., "make it more punchy"). Clicks Regenerate. Frontend calls `regeneratePostAction({ postId, regenerateNote })`. Loading state on button. Post content card updates with new `generatedContent`. Clears any saved edits.

**Reject interaction:** User clicks "Reject". Confirmation prompt ("Reject this post? It will be saved but won't affect your style profile."). On confirm, calls `rejectPost({ postId })`. Post card clears. User can generate a new post.

### 2.4 Data Flow

**Generate (user-led):**
1. User enters topic + opinion, clicks Generate
2. Frontend calls `generatePost({ userId, topic, userInput, mode: "user-led" })`
3. Action queries `getUser` + `getStyleProfile`
4. Action calls LLM with profile + style + topic + input
5. Action calls `createPost` mutation with generated content, status "draft"
6. Action returns `{ postId, generatedContent }`
7. Frontend displays post in Section B

**Generate (surprise-me):**
1. User clicks "Surprise Me"
2. Frontend picks random topic from cached user topics
3. Frontend calls `generatePost({ userId, topic: randomTopic, mode: "surprise-me" })`
4. Same as above but `userInput` is empty

**Regenerate:**
1. User clicks Regenerate, enters optional comment
2. Frontend calls `regeneratePostAction({ postId, regenerateNote })`
3. Action queries post doc + user + style profile
4. Action calls LLM with same context + regenerate note
5. Action calls `regeneratePost` mutation (replaces `generatedContent`)
6. Frontend updates post card

**Reject:**
1. User clicks Reject, confirms
2. Frontend calls `rejectPost({ postId })`
3. Mutation sets status to "rejected"
4. Frontend clears post card

### 2.5 Error Handling (Group 2)

| Scenario | Handling |
|---|---|
| LLM call fails (generate or regenerate) | Show inline error message. Post is not created/updated. |
| No stored `userId` or invalid user | Redirect to `/` (profile picker). |
| User has no style profile (onboarding incomplete) | Redirect to `/` (profile picker). User selects profile or resumes onboarding from home. |
| "Surprise Me" but topics array is empty | Disable "Surprise Me" button. Should not happen if onboarding is complete. |

---

## Build Group 3: Polish, Publish + Repository

**Status:** Built. Implementation: `convex/posts.ts` (`getFinalizedPosts`, `finalizePost`), `convex/postActions.ts` (`finalizePostAction`), `convex/lib/postPrompts.ts` (Call 5), inline editor + repository in `components/dashboard/DashboardContent.tsx`.

### 3.1 Convex Functions

#### Queries

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `getFinalizedPosts` | `userId: v.id("users")` | Post[] where status = "finalized", sorted by finalizedAt desc | Post repository list |

#### Mutations

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `finalizePost` | `postId, finalContent, editsDiff?` | void | Set `status` to `"finalized"`, set `finalContent`, optional `editsDiff`, set `finalizedAt` to current timestamp. Only draft posts. |

#### Actions (LLM calls)

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `finalizePostAction` | `postId, finalContent` | `{ updatedProfileText: string \| null, profileUpdateFailed: boolean }` | LLM Call 5 when user edited the draft. If `finalContent` equals `generatedContent` (no edits), skips Call 5 and finalizes directly. Otherwise: calls LLM for updated profile + edits diff, attempts `updateStyleProfile`, then `finalizePost`. Returns `profileUpdateFailed: true` if style profile mutation fails after a successful LLM call. |

### 3.2 LLM Call Coverage

#### Call 5: Style Profile Update on Finalize

| Property | Value |
|---|---|
| Triggered by | User clicking "Finalize" on a draft post **when content was edited** |
| Convex action | `finalizePostAction` |
| Input | `postId`, `finalContent` (edited version) |
| Context pulled by action | Post doc (`generatedContent` = original) + `styleProfiles` doc (current `profileText`) |
| Skipped when | `finalContent.trim() === generatedContent` — no LLM call; post finalized with no `editsDiff`; style profile unchanged |
| LLM output | `{ updatedProfileText, editsDiff }` — parsed via `parseCall5Result` in `convex/lib/postPrompts.ts` |
| Output stored | `posts.editsDiff` + `posts.finalContent` + `styleProfiles.profileText` (when Call 5 runs and profile update succeeds) |
| Prompt coverage | Compare original post with final edited post. Identify what the user changed and what that signals about preferences. Update existing style profile to reflect these signals. Max 200 words. Do not make longer than previous version. |
| Loading UX | Button shows "Finalizing and learning..." while action runs. On completion, draft card shows "Post finalized" + Copy button. |
| Degraded success | If `updateStyleProfile` fails after LLM succeeds, post is still finalized. UI shows amber warning: "Post finalized, but style profile couldn't be updated..." |

### 3.3 Screen Spec: Post Editor + Repository

These are part of the Dashboard screen (`/dashboard`). No separate route.

#### Section B: Inline Editor (draft card)

| Element | Type | When Shown | Action |
|---|---|---|---|
| Draft / finalized header | Section header | After generation | "Your draft" while draft; "Finalized post" + green success line after finalize |
| Post content display | Pre-wrapped text block | Default view | Shows `editedContent` if saved, else `generatedContent` |
| Editable textarea | Textarea pre-filled with display content | When user clicks "Edit" | User edits inline; Regenerate/Reject hidden while editing |
| "Save Edits" button | Button | In edit mode | Saves trimmed edits to client state (`editedContent`), exits edit mode |
| "Cancel" button | Button | In edit mode | Discards unsaved textarea changes, exits edit mode |
| "Edit" + "Finalize" buttons | Buttons | Draft, not editing | Edit enters edit mode; Finalize calls `finalizePostAction` |
| Profile-update warning | Amber banner | After finalize when `profileUpdateFailed` | Warns style profile was not updated |
| "Copy" button | Button | After finalize | Copies `finalContent` to clipboard; shows "Copied!" for 2 seconds |

**Edit interaction:** User clicks "Edit". Draft card shows textarea. User edits. "Save Edits" stores edits in frontend state only (not persisted until finalize). "Cancel" reverts to last saved display content.

**Finalize flow:**
1. User clicks "Finalize" (available without entering edit mode — uses `generatedContent` if no edits saved)
2. Frontend sets `finalContent` = `editedContent ?? generatedContent`
3. Frontend calls `finalizePostAction({ postId, finalContent })`
4. Button shows "Finalizing and learning..." loading state
5. On success: card switches to finalized state, Regenerate/Reject/Edit hidden, Copy revealed
6. If `profileUpdateFailed`, show amber warning banner
7. "My Posts" repository refreshes via `getFinalizedPosts` subscription

#### Section C: Post Repository

| Element | Type | Purpose |
|---|---|---|
| "My Posts" header | Section header | Always visible below generation + draft areas |
| Post list | Cards from `getFinalizedPosts` | Each card: topic, finalized date, content preview (first 100 chars), Copy, View Full / Collapse |
| Empty state | Static text | "No posts yet. Generate your first post above." |
| Loading state | Static text | "Loading posts..." while query pending |

### 3.4 Data Flow

**Finalize (with edits):**
1. User clicks "Finalize" on a draft post (optionally after Save Edits)
2. Frontend determines `finalContent` = `editedContent ?? generatedContent`
3. If `finalContent === generatedContent`, action skips Call 5 → `finalizePost` only → done
4. Otherwise frontend calls `finalizePostAction({ postId, finalContent })`
5. Action queries post doc + style profile
6. Action calls OpenRouter (Call 5) with original post, final post, current profile
7. LLM returns `updatedProfileText` + `editsDiff`
8. Action calls `updateStyleProfile` (may fail gracefully)
9. Action calls `finalizePost({ postId, finalContent, editsDiff })`
10. Frontend shows finalized state + Copy; repository list updates

**Finalize (no edits):**
1. User clicks "Finalize" without editing
2. `finalContent` equals `generatedContent` — action finalizes immediately, no Call 5, no `editsDiff`

**Copy:**
1. User clicks "Copy" on finalized draft card or repository card
2. `navigator.clipboard.writeText(finalContent)`
3. Button shows "Copied!" for 2 seconds; on failure, inline error "Copy failed, please select and copy manually."

### 3.5 Error Handling (Group 3)

| Scenario | Handling |
|---|---|
| LLM call 5 fails | Action throws; post not finalized. Inline error on dashboard. |
| Style profile mutation fails after successful Call 5 | Post still finalized with `editsDiff`. `profileUpdateFailed: true` returned. Amber warning in UI. |
| Copy to clipboard fails | Inline error: "Copy failed, please select and copy manually." |
| Finalize on already-finalized post | Action throws "Only draft posts can be finalized." Should not happen — UI disables actions on finalized card. |
| Finalize with empty content | Frontend and action both guard against empty `finalContent`. |

---

# 5. Prompt Engineering

**Status:** Implemented in code. Ongoing quality tuning deferred.

| Call | Prompt module | Parser / params |
|---|---|---|
| 1. Background inference | `convex/lib/onboardingPrompts.ts` | Plain text via `chatCompletion` |
| 2. Style samples | `convex/lib/onboardingPrompts.ts` | JSON via `chatCompletionJson` |
| 3. Style profile synthesis | `convex/lib/onboardingPrompts.ts` | Plain text via `chatCompletion` |
| 4. Post generation | `convex/lib/postPrompts.ts` | Plain text via `chatCompletion` |
| 4a. Regenerate | `convex/lib/postPrompts.ts` | Plain text via `chatCompletion` |
| 5. Style profile update | `convex/lib/postPrompts.ts` | JSON via `parseCall5Result` |

**OpenRouter client:** `convex/lib/openrouter.ts` — `chatCompletion`, `chatCompletionJson` (fence-strip + single retry on parse failure). Model and API key from Convex deployment env vars.

**Remaining tuning (not blocking MVP):** Prompt iteration, model comparison, token budget review, real founder usage cycles for the learning loop.
