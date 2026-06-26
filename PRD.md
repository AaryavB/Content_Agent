# Product Requirements Document (PRD)

## Product Name

AI Ghostwriter Agent

## Objective

Build an AI Ghostwriter Agent that learns a founder's identity, writing style, topics of interest, and content preferences to generate LinkedIn posts that closely match how the founder writes and what they are likely to approve.

The MVP validates whether a personalized AI can consistently produce high-quality LinkedIn drafts requiring minimal edits before publishing. The MVP is a single-user tool operated by a ghostwriter (Aaryav) for one founder. The data model is designed for multi-user from the start so that a SaaS transition post-MVP requires only adding authentication, not restructuring.

---

# 1. Problem Statement

Professionals, founders, creators, and executives often struggle to consistently create content despite having valuable ideas and expertise.

Current AI writing tools generate generic content but fail to:

- Understand the user's background
- Replicate the user's writing style
- Write about topics the user cares about
- Learn from user feedback

As a result, users spend significant time editing AI-generated content before publishing.

The AI Ghostwriter Agent solves this by building a personalized knowledge bank that continuously improves content generation based on user-specific data and feedback.

---

# 2. Product Overview

The product is a 3-step flow. Everything in the system serves one of these three steps.

## Step 1: Onboarding (Profile + Style Learning)

The founder is onboarded through a lightweight, low-friction flow. The goal is to capture enough context for personalized generation without making it feel like filling out a resume.

**1a. Quick Profile (3 inputs)**

- Name
- Role
- Organization

No other manual fields. Everything else is inferred.

**1b. Professional Background (paste, not type)**

- User pastes their LinkedIn employment history / about section into a single text box
- One LLM call extracts: industry, background, achievements, professional context
- Output is stored as a concise professional background summary (max 150 words)
- This replaces any manual "enter your achievements" form fields

**1c. Topics**

- User picks 3-4 topics they usually write about or care about
- Simple text input or tag picker
- Stored as a flat list

**1d. Style Learning via Interactive Sample Selection**

- System takes the first topic the user picked
- Generates 5 short one-paragraph sample posts on that same topic, same idea, in 5 distinct styles:
  1. Contrarian
  2. Humble
  3. Flashy
  4. Preachy
  5. Conversational
- User picks up to 2 styles that resonate with how they would write
- **Optionally:** user can write their own version of the post in their own words
- **Selection rules:**
  - If user does NOT write their own sample: pick up to 2 styles from the 5 generated samples
  - If user DOES write their own sample: pick only 1 style from the 5 generated samples (user's own writing carries primary weight, the single style pick refines direction)
- **Weightage logic:**
  - If user writes their own sample: 75% weight to user's writing, 25% to the 1 selected style
  - If user only picks from generated samples: the up to 2 selected styles define the profile
- One LLM call synthesizes the selections (and optional user writing) into a Writing Style Profile

**Onboarding output: a complete user profile containing:**
- Personal preferences (name, role, organization)
- Professional background (inferred from LinkedIn paste)
- Writing style profile (from interactive style selection + optional own writing)
- Topics list (3-4 user-selected)

---

## Step 2: Generate (Topic + Input to Post)

- User enters a topic + their take/opinion/inputs on it
- Clicks generate
- One LLM call produces a LinkedIn post in the user's style
- Post structure: hook + body + CTA
- **"Surprise Me" button:** simplified agent-led mode. Picks a random topic from the user's topic list, generates a post with no user input beyond the topic. Optionally picks a random angle (hot take, story, lesson learned, contrarian view).
- **Regenerate:** if the user is not happy with the generated post but it's in the right ballpark, they can regenerate with an optional comment on what angle to adjust (e.g., "make it more punchy", "less humble", "add a specific example"). The regenerate uses the same topic + original user input + the comment as additional guidance for the LLM call. The previous draft is replaced.
- **Expectation messaging in UI:** "The agent gets better after 5-6 finalized posts. Keep reviewing and editing." Sets the expectation that quality improves with usage.

**LLM context for generation:**
- User profile (personal preferences + professional background)
- Writing style profile
- Topics list
- User's topic + opinion input (for user-led mode)

---

## Step 3: Polish and Publish (Edit, Finalize, Learn)

- User reviews the generated post
- Three paths from here:
  - **Edit:** user makes edits directly in an inline editor, then finalizes
  - **Regenerate:** user provides an optional comment on what to adjust and gets a fresh draft (same topic + inputs + comment as guidance). Previous draft is replaced.
  - **Reject:** if the post is completely off-track and not worth editing or regenerating, user rejects it. Rejected posts are saved with "rejected" status but do not trigger a style profile update.
- When user marks the post as "good to go" / finalizes:
  - System makes one additional LLM call with: original generated post, user profile, writing style profile, final edited post, and the diff of edits made
  - LLM updates/tweaks the writing style profile based on the edits
  - This is the learning loop: each finalized post makes the next generation slightly better
- Finalized posts show a **Copy** button so the user can copy the text and paste it into LinkedIn
- Finalized posts are saved to a **Post Repository** (list view of all posts the user has finalized using the platform)

---

# 3. MVP Scope vs Post-MVP

## MVP (what we build now)

| Feature | Notes |
|---|---|
| Quick 3-input profile | Name, role, organization |
| LinkedIn paste to inferred background | One LLM call, concise output |
| Topic selection (3-4) | Flat list, no related themes |
| Interactive 5-style sample selection | Core style learning mechanism |
| Optional user-written sample with 75% weightage | Extra text field + prompt weighting |
| User-led post generation | Topic + opinion to post |
| "Surprise Me" (agent-led simplified) | One button, random topic from list |
| Edit + finalize flow | Inline editing, mark as final |
| Regenerate with comment | Same topic + inputs + optional angle comment. Previous draft replaced. |
| Reject post | For completely off-track posts. Saved but no style profile update. |
| Copy finalized post | One-click copy to clipboard for pasting into LinkedIn |
| Style profile update on finalize | One LLM call, updates the style profile |
| Post repository (history) | Simple list of finalized posts |
| Expectation messaging | UI text, zero build effort |

## Post-MVP (future, not built now)

| Feature | Notes |
|---|---|
| Multi-user / authentication | Schema is already userId-keyed. Add auth + row-level filtering. |
| Content idea generation | Separate feature with own flow. Cut for MVP. "Surprise Me" covers the "I don't know what to write about" user story adequately. |
| Thinking framework as a separate evolving field | Folded into style profile for MVP. Can be extracted as its own artifact post-MVP if needed. |
| SaaS productization | Founder self-onboards, manages own profile. Aaryav becomes platform provider. |

---

# 4. Data Model (Convex)

All tables are keyed by `userId`. MVP seeds one user manually. Post-MVP adds authentication and the same schema works unchanged.

## Table: `users`

The founder being ghostwritten.

| Field | Type | How It's Generated | Notes |
|---|---|---|---|
| `_id` | Id | Auto (Convex) | |
| `name` | string | User input (onboarding 1a) | |
| `role` | string | User input (onboarding 1a) | |
| `organization` | string | User input (onboarding 1a) | |
| `professionalBackground` | string | LLM call (onboarding 1b) | Inferred from LinkedIn paste. Max 150 words. |
| `topics` | string[] | User input (onboarding 1c) | 3-4 topics, flat list |
| `createdAt` | number | Auto | |

## Table: `styleProfiles`

The writing style profile. One active profile per user. Updated on each post finalization.

| Field | Type | How It's Generated | Notes |
|---|---|---|---|
| `_id` | Id | Auto (Convex) | |
| `userId` | Id (users) | Set on creation | |
| `profileText` | string | LLM call (onboarding 1d) | Synthesized from style selections + optional user writing. Updated on each post finalize. Max 200 words. |
| `userWritingSample` | string (optional) | User input (onboarding 1d) | Raw text if user wrote their own sample. Stored for reference. |
| `selectedStyles` | string[] | User input (onboarding 1d) | Up to 2 styles if no user writing sample, 1 style if user wrote their own. (e.g., ["humble", "conversational"]) |
| `sampleWritingWeight` | number | System logic | 0.75 if user wrote sample, 0 if not. Used in initial profile generation prompt. |
| `updatedAt` | number | Auto | |

## Table: `posts`

Generated posts. Each post is a generation attempt that can be edited and finalized.

| Field | Type | How It's Generated | Notes |
|---|---|---|---|
| `_id` | Id | Auto (Convex) | |
| `userId` | Id (users) | Set on creation | |
| `topic` | string | User input or "Surprise Me" selection | |
| `userInput` | string (optional) | User input (user-led mode) | User's opinion/take on the topic. Empty for "Surprise Me". |
| `mode` | string | System | "user-led" or "surprise-me" |
| `generatedContent` | string | LLM call (Step 2) | The original generated post. Replaced on regenerate. |
| `regenerateNote` | string (optional) | User input (Step 2/3) | Comment on what angle to adjust (e.g., "make it more punchy"). Used as guidance for regenerate LLM call. |
| `finalContent` | string (optional) | User edit (Step 3) | The final edited version. Same as generatedContent if no edits. |
| `status` | string | System | "draft", "finalized", "rejected". Rejected = completely off-track, no style profile update. |
| `editsDiff` | string (optional) | LLM call on finalize (Step 3) | Summary of edits made. Used as input for style profile update. |
| `createdAt` | number | Auto | |
| `finalizedAt` | number (optional) | Auto | Set when user finalizes |

## Table: `backgroundInputs`

Raw paste from onboarding. Stored separately for reference/re-processing.

| Field | Type | How It's Generated | Notes |
|---|---|---|---|
| `_id` | Id | Auto (Convex) | |
| `userId` | Id (users) | Set on creation | |
| `linkedinPaste` | string | User input (onboarding 1b) | Raw LinkedIn paste |
| `createdAt` | number | Auto | |

---

# 5. Knowledge Artifacts and Generation Logic

The system has stored artifacts that get injected into LLM prompts. Each artifact has rules for how it's generated and constraints on its size.

## Artifact 1: Professional Background Summary

| Property | Value |
|---|---|
| Stored in | `users.professionalBackground` |
| Generated by | One LLM call during onboarding (1b) |
| Input | Raw LinkedIn paste (`backgroundInputs.linkedinPaste`) |
| Max size | 150 words |
| Purpose | Provides professional context for post generation |
| Updated | Only if user re-pastes their LinkedIn info |

**Prompt coverage (not actual prompt):** Extract professional background, industry, key achievements, roles, and notable context from the pasted text. Output a concise summary. Do not include irrelevant personal details. Keep under 150 words.

## Artifact 2: Writing Style Profile

| Property | Value |
|---|---|
| Stored in | `styleProfiles.profileText` |
| Generated by | One LLM call during onboarding (1d), updated on each post finalize (Step 3) |
| Initial input | Selected styles + optional user writing sample |
| Update input | Original post, final post, edits diff, current style profile |
| Max size | 200 words |
| Purpose | Core personalization artifact. Injected into every generation call. |
| Updated | Every time a post is finalized |

**Prompt coverage for initial generation (not actual prompt):** Synthesize the user's selected writing styles (up to 2, or 1 if user wrote their own sample) and optional user-written sample into a concise writing style profile. Cover: tone, sentence structure, vocabulary patterns, formatting habits, and thinking patterns (how the user frames arguments, what they emphasize, what they avoid). If user writing sample is provided, weight it at 75% and the single selected style at 25%. If no user writing sample, the up to 2 selected styles carry equal weight. Keep under 200 words.

**Prompt coverage for update on finalize (not actual prompt):** Compare the original generated post with the final edited post. Identify what the user changed and what that signals about their preferences. Update the existing style profile to reflect these signals. Output the updated profile. Keep under 200 words. Do not make it longer than the previous version unless absolutely necessary.

---

# 6. LLM Call Inventory

The system makes LLM calls at these points. Detailed prompts will be defined in the functional requirements section.

| Call | When | Input | Output | Constraint |
|---|---|---|---|---|
| 1. Background inference | Onboarding 1b | LinkedIn paste | Professional background summary | Max 150 words |
| 2. Style sample generation | Onboarding 1d | First topic + 5 style labels | 5 short one-paragraph posts in different styles | One paragraph each |
| 3. Style profile synthesis | Onboarding 1d | Selected styles (up to 2, or 1 if user wrote sample) + optional user writing | Writing style profile | Max 200 words |
| 4. Post generation | Step 2 | User profile + style profile + topic + user input | LinkedIn post (hook + body + CTA) | Concise, platform-appropriate |
| 4a. Regenerate | Step 2/3 | Same as call 4 + regenerate note (angle comment) | New LinkedIn post (hook + body + CTA) | Concise, platform-appropriate |
| 5. Style profile update | Step 3 (on finalize) | Original post + final post + edits diff + current style profile | Updated writing style profile | Max 200 words, not longer than previous |

---

# 7. Key Constraints

1. **All stored LLM artifacts must be extremely concise.** Style profile, professional background, and any auto-updated fields have strict word limits (150-200 words). If these become long documents, they will bloat the context window for every future generation call and degrade output quality.

2. **Minimize manual data entry.** The system infers as much as possible. The only manual inputs are: 3 profile fields, one LinkedIn paste, 3-4 topics, and style selections. Everything else is LLM-generated.

3. **Every table is userId-keyed.** Even though MVP is single-user, the schema must support multi-user without restructuring. This is a zero-cost decision now that prevents a rewrite later.

4. **One LLM call per action.** Each generation point (background, style, post, regenerate, update) is a single LLM call. Regenerate is the same call as post generation with an additional regenerate note as input. No multi-step chains or agentic loops for MVP.

5. **The learning loop is simple.** Style profile updates on finalize. Approved/finalized posts are not added as separate training data. The style profile text itself is the only thing that evolves.

---

# 8. User Stories

### Onboarding

As a user, I want to enter my name, role, and organization so the AI knows who I am.

As a user, I want to paste my LinkedIn experience so the AI can infer my professional background without me typing it all out.

As a user, I want to pick topics I care about so the AI knows what I write about.

### Style Learning

As a user, I want to see 5 different writing styles on the same topic and pick up to 2 that feel most like me, so the AI learns how I write without me having to upload old posts.

As a user, I want to optionally write my own version of a sample post so the AI prioritizes my actual writing voice.

### Content Creation

As a user, I want to enter a topic and my take on it and get a LinkedIn post that sounds like me.

As a user, I want a "Surprise Me" button that picks a topic and writes a post when I don't want to steer the content.

As a user, I want to know that the AI will improve after a few posts so I have the right expectations.

### Polish and Publish

As a user, I want to edit the generated post inline so I can fix anything that feels off.

As a user, I want to regenerate a post with a comment on what to adjust so I can get a better take without starting over.

As a user, I want to reject a post that is completely off-track so it's saved but doesn't affect my style profile.

As a user, I want to finalize a post so the AI learns from my edits and improves future drafts.

As a user, I want to copy my finalized post so I can paste it into LinkedIn.

As a user, I want to see all my finalized posts in one place so I can track what I've published.

---

# 9. Functional Requirements

Detailed functional requirements (tech stack, Convex schema, functions, LLM call coverage, screen specs, data flows, error handling) are in @functional-requirements.md.

The functional requirements are grouped into 3 build groups, each self-contained for a Cursor session:

- **Build Group 1: Foundation + Onboarding** - Convex schema, onboarding flow, LLM calls 1-3
- **Build Group 2: Post Generation** - Dashboard, generation flow, regenerate, reject, LLM calls 4 & 4a
- **Build Group 3: Polish, Publish + Repository** - Inline editor, finalize, copy, post repository, LLM call 5

LLM prompt text is not yet defined. Prompt engineering will be a separate session.
