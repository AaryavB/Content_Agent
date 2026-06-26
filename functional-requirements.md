# Functional Requirements

**Product:** AI Ghostwriter Agent

**Purpose:** Implementation-level specifications for building the MVP. This document is designed to be handed to Cursor (or any AI coding agent) as build-session prompts. Each build group is self-contained.

**Product context:** See `PRD.md` for product overview, problem statement, MVP scope, data model summary, LLM call inventory, key constraints, and user stories.

**Prompt note:** LLM prompt text is NOT included in this document. Prompts will be defined in a separate prompt engineering session. Each LLM call section below specifies inputs, outputs, storage, and prompt coverage (what the prompt should address), but not the actual prompt text.

---

# 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router) | Most well-documented with Cursor. Student-friendly. |
| Backend + DB | Convex | Schema, functions, real-time. All-in-one backend. |
| Styling | Tailwind CSS | Standard with Next.js + Cursor. |
| LLM Provider | TBD | Architecture should isolate LLM calls in Convex actions so provider can be swapped. |
| LLM SDK | TBD | Will be decided in prompt engineering session. |

**Architectural pattern:** LLM calls happen inside Convex actions (server-side functions). Each action follows the pattern: query needed data from Convex, call LLM, store result via mutation. Frontend calls actions, never calls the LLM directly.

---

# 2. Functional Requirements

Functional requirements are grouped into 3 build groups. Each group is self-contained and can be handed to Cursor as a single session prompt. Each group specifies: Convex schema/functions, LLM call coverage (inputs/outputs/storage, not prompt text), screen specs, and data flow.

---

## Build Group 1: Foundation + Onboarding

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

#### Call 2: Style Sample Generation

| Property | Value |
|---|---|
| Triggered by | User completing topics (step 3) and advancing to step 4 |
| Convex action | `generateStyleSamples` |
| Input | `topic` (first topic from user's list) |
| Output | 5 objects: `{ style: string, content: string }` (one paragraph each) |
| Stored in | Nothing. Returned to frontend for display only. |
| Prompt coverage | Generate 5 short one-paragraph posts on the given topic, same idea, in 5 distinct styles: contrarian, humble, flashy, preachy, conversational. Each post is one paragraph. |
| Loading UX | Show skeleton cards or spinner while samples generate. Display 5 cards when ready. |

#### Call 3: Style Profile Synthesis

| Property | Value |
|---|---|
| Triggered by | User selecting styles (and optionally writing own sample) and clicking "Finish Onboarding" |
| Convex action | `synthesizeStyleProfile` |
| Input | `selectedStyles` (up to 2, or 1 if user wrote sample), `userWritingSample` (optional), `sampleWritingWeight` (0.75 or 0) |
| Output | `profileText` (string, max 200 words) |
| Stored in | `styleProfiles` table (new doc) |
| Prompt coverage | Synthesize selected styles + optional user writing into concise style profile. Cover: tone, sentence structure, vocabulary patterns, formatting habits, thinking patterns. Weight user writing at 75% if provided. Max 200 words. |
| Loading UX | Show processing state on step 4. Redirect to dashboard on completion. |

### 1.4 Screen Spec: Onboarding (Multi-Step Form)

**Route:** `/onboarding`

**Layout:** Single page, 4 sequential steps. Progress indicator at top (Step 1 of 4, etc.). No skip buttons. Each step has a primary action button that advances to the next step.

#### Step 1: Quick Profile

| Element | Type | Validation | Stores To |
|---|---|---|---|
| Name | Text input | Required, non-empty | `users.name` via `createUser` |
| Role | Text input | Required, non-empty | `users.role` via `createUser` |
| Organization | Text input | Required, non-empty | `users.organization` via `createUser` |
| "Continue" button | Button | Disabled until all 3 fields filled | Calls `createUser` mutation, advances to step 2 |

**Data flow:** User fills 3 fields, clicks Continue. Frontend calls `createUser({ name, role, organization })`. Returns `userId`. Store `userId` in client state (needed for remaining steps). Advance to step 2.

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

### 1.5 Error Handling (Group 1)

| Scenario | Handling |
|---|---|
| LLM call fails (any of calls 1, 2, 3) | Show error message with "Retry" button. Do not advance step. |
| User refreshes mid-onboarding | `userId` is lost from client state. On mount, check if user has incomplete profile (empty `professionalBackground` or empty `topics` or no `styleProfile`). Resume from the first incomplete step. |
| LinkedIn paste too short | Validation prevents submission (min 50 chars). Show inline error. |

---

## Build Group 2: Post Generation

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

**Layout:** Two sections stacked vertically. Top section is the generation form. Bottom section is the post display and actions. Post repository is a separate tab or section below.

#### Section A: Generation Form

| Element | Type | Validation | Action |
|---|---|---|---|
| Topic input | Text input | Required for "Generate", hidden/disabled for "Surprise Me" | N/A |
| Opinion/input textarea | Large textarea | Optional for "Generate", hidden for "Surprise Me" | N/A |
| "Generate" button | Primary button | Disabled until topic entered | Calls `generatePost` action with mode "user-led" |
| "Surprise Me" button | Secondary button | Always enabled (requires user to have topics) | Calls `generatePost` action with mode "surprise-me", random topic from `users.topics` |
| Expectation text | Static text | "The agent gets better after 5-6 finalized posts. Keep reviewing and editing." | N/A |

**"Surprise Me" flow:** Frontend picks a random topic from the user's topic list (fetched via `getUser`). Calls `generatePost({ userId, topic: randomTopic, mode: "surprise-me" })`. No topic or opinion inputs needed from user.

#### Section B: Post Display + Actions

| Element | Type | When Shown | Action |
|---|---|---|---|
| Post content card | Card displaying `generatedContent` | After generation completes | N/A |
| "Edit" button | Button | Always shown on draft posts | Toggles inline edit mode (Group 3) |
| "Regenerate" button + comment input | Button + small text input | Always shown on draft posts | Calls `regeneratePostAction` with optional comment |
| "Reject" button | Destructive button | Always shown on draft posts | Calls `rejectPost` mutation, marks as rejected, clears post display |
| "Finalize" button | Primary button | Shown on draft posts (also after edit) | Triggers finalize flow (Group 3) |

**Regenerate interaction:** User clicks "Regenerate", optional comment input appears (or is always visible). User enters optional comment (e.g., "make it more punchy"). Clicks confirm. Frontend calls `regeneratePostAction({ postId, regenerateNote })`. Loading state. Post content card updates with new `generatedContent`.

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
| LLM call fails (generate or regenerate) | Show error message with "Retry" button. Post is not created/updated. |
| User has no style profile (onboarding incomplete) | Redirect to `/onboarding`. Dashboard mount checks for style profile. |
| User has no topics (onboarding incomplete) | Redirect to `/onboarding`. |
| "Surprise Me" but topics array is empty | Disable "Surprise Me" button. Should not happen if onboarding is complete. |

---

## Build Group 3: Polish, Publish + Repository

### 3.1 Convex Functions

#### Queries

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `getFinalizedPosts` | `userId: v.id("users")` | Post[] where status = "finalized", sorted by finalizedAt desc | Post repository list |

#### Mutations

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `finalizePost` | `postId, finalContent, editsDiff` | void | Set `status` to "finalized", set `finalContent`, set `editsDiff`, set `finalizedAt` to current timestamp |

#### Actions (LLM calls)

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `finalizePostAction` | `postId, finalContent` | `{ updatedProfileText }` | LLM Call 5. Queries post (for original `generatedContent`) + style profile. Computes edits diff internally. Calls LLM to update style profile. Stores final post via `finalizePost` mutation + updates style profile via `updateStyleProfile` mutation. Returns updated profile text. |

### 3.2 LLM Call Coverage

#### Call 5: Style Profile Update on Finalize

| Property | Value |
|---|---|
| Triggered by | User clicking "Finalize" on a post |
| Convex action | `finalizePostAction` |
| Input | `postId`, `finalContent` (edited version) |
| Context pulled by action | Post doc (`generatedContent` = original, `finalContent` = edited) + `styleProfiles` doc (current `profileText`) |
| Internal computation | Action computes a simple diff/summary of changes between `generatedContent` and `finalContent`. This diff is passed to the LLM as context. |
| Output | Updated `profileText` (string, max 200 words, not longer than previous version) |
| Stored in | `posts.editsDiff` + `posts.finalContent` + `styleProfiles.profileText` (all updated) |
| Prompt coverage | Compare original post with final edited post. Identify what the user changed and what that signals about preferences. Update existing style profile to reflect these signals. Max 200 words. Do not make longer than previous version. |
| Loading UX | Show "Finalizing and learning..." state. On completion, show success confirmation. |

### 3.3 Screen Spec: Post Editor + Repository

These are additions to the Dashboard screen from Group 2. No new route needed.

#### Inline Editor (on Dashboard, Section B)

| Element | Type | When Shown | Action |
|---|---|---|---|
| Editable text area | Text area pre-filled with `generatedContent` | When user clicks "Edit" on a draft post | User edits inline |
| "Save Edits" button | Button | In edit mode | Saves edits to local state, exits edit mode, shows updated content |
| "Cancel" button | Button | In edit mode | Discards edits, exits edit mode, restores original content |
| "Finalize" button | Primary button | After edit mode (or directly on draft) | Calls `finalizePostAction` |

**Edit interaction:** User clicks "Edit". Post content card transforms into a textarea pre-filled with `generatedContent`. User edits. Clicks "Save Edits" to confirm (content stored in frontend state as the edited version). Clicks "Finalize" to trigger the finalize flow.

**Finalize flow:**
1. User clicks "Finalize"
2. Frontend checks if content was edited. If yes, `finalContent` = edited version. If no, `finalContent` = `generatedContent`.
3. Frontend calls `finalizePostAction({ postId, finalContent })`
4. Show "Finalizing and learning..." loading state
5. Action computes edits diff, calls LLM to update style profile, stores everything
6. On completion: show success state on post card. Reveal "Copy" button.

#### Copy Button

| Element | Type | When Shown | Action |
|---|---|---|---|
| "Copy" button | Button | After post is finalized | Copies `finalContent` to clipboard |

**Copy interaction:** User clicks "Copy". `navigator.clipboard.writeText(finalContent)`. Show brief "Copied!" confirmation (2 seconds, then revert to "Copy").

#### Post Repository (on Dashboard, Section C)

| Element | Type | Purpose |
|---|---|---|
| "My Posts" header | Section header | Below the generation area |
| Post list | List of cards | Each card shows: topic, finalized date, content preview (first 100 chars), "Copy" button, "View Full" expand |
| Empty state | Static text | "No posts yet. Generate your first post above." |

**Repository data flow:** On dashboard mount, call `getFinalizedPosts({ userId })`. Display list. Each card has a "Copy" button (same behavior as above). "View Full" expands the card to show full `finalContent`.

### 3.4 Data Flow

**Finalize:**
1. User clicks "Finalize" on a draft post
2. Frontend determines `finalContent` (edited or original)
3. Frontend calls `finalizePostAction({ postId, finalContent })`
4. Action queries post doc + style profile
5. Action computes diff between `generatedContent` and `finalContent`
6. Action calls LLM with: original post, final post, diff, current style profile
7. LLM returns updated `profileText`
8. Action calls `finalizePost({ postId, finalContent, editsDiff })` mutation
9. Action calls `updateStyleProfile({ userId, profileText })` mutation
10. Action returns `{ updatedProfileText }`
11. Frontend shows success state + "Copy" button
12. Post repository list refreshes (or appends the new finalized post)

**Copy:**
1. User clicks "Copy" on a finalized post
2. Frontend calls `navigator.clipboard.writeText(finalContent)`
3. Show "Copied!" confirmation

### 3.5 Error Handling (Group 3)

| Scenario | Handling |
|---|---|
| LLM call 5 fails (style profile update) | Post is still finalized (save `finalContent` and `editsDiff`). Style profile update fails gracefully. Show warning: "Post finalized, but style profile couldn't be updated. Future posts may not reflect your latest edits." |
| Copy to clipboard fails | Fallback: select text manually. Show "Copy failed, please select and copy manually." |
| Finalize on already-finalized post | Disable "Finalize" button on finalized posts. Should not happen. |

---

# 3. Remaining: Prompt Engineering

The following will be defined in a separate session:

- Actual LLM prompt text for all 5 calls (1, 2, 3, 4, 4a, 5)
- System prompts vs user prompts
- Token budget per call
- Output parsing strategy (structured output vs free text)
- LLM provider selection (OpenAI, Anthropic, etc.)
- Model selection per call (e.g., cheaper model for background inference, stronger model for post generation)
