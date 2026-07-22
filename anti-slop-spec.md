# Product Spec — Anti-Slop Output Layer (Content Agent)

**Author:** Krishna (product) · **For:** implementing agent working inside the `content-agent` repo
**Status:** Ready to build · **Type:** prompt + logic change, no schema migration required for P0
**Related docs:** `prompt-engineering.md`, `convex/lib/postPrompts.ts`, `convex/postActions.ts`, `convex/lib/openrouter.ts`

---

## 1. Problem & goal (PM framing)

The build works end-to-end and the UI is clean. The remaining blocker to value is **the writing itself**. Generated drafts still carry the tells of AI-generated LinkedIn content ("AI slop"), so the founder has to rewrite before posting. That defeats the product's core promise: a draft that is **directly usable** — copy, paste, post.

**North-star outcome:** the median generated draft is postable with zero or near-zero edits.

**Highest-ROI lever:** an anti-slop enforcement layer on the generation path. It is the cheapest change (prompt + a small deterministic filter, no new screens, no schema change) with the most direct impact on "is this usable." Everything else (new features, model upgrades) is lower ROI until the output reads human.

This spec covers **only** that layer. Non-goals are listed in §9.

---

## 2. Why a prompt instruction alone is not enough

Telling the model "don't write slop" reduces slop but does not eliminate it — LLMs leak banned patterns under temperature. The user requirement is that certain patterns are **NEVER** shipped. That requires three layers working together:

1. **Prevent** — hard negative constraints in the system prompts (Calls 2, 3, 4, 5).
2. **Detect** — a deterministic, regex-based linter that runs on every AI generation and returns a list of violations.
3. **Repair** — one silent regeneration seeded with the specific violations; if it still fails, a conservative deterministic scrub of the exact-match tokens as a last resort.

This gives a true guarantee for the machine-detectable set (punctuation, exact phrases, banned vocabulary, engagement-bait CTAs) and strong suppression for the structural/tonal set.

---

## 3. The AI Slop Blocklist

This is the canonical list. It is compiled from current (2025–2026) sources on LinkedIn AI-slop and ChatGPT writing tells (see §10). It is split by how it is enforced:

- **Tier 1 — Hard-banned, machine-detectable.** Caught by the linter (§5.3). Must never appear in a shipped draft.
- **Tier 2 — Structural/tonal, prompt-enforced.** Hard to regex reliably; suppressed via prompt constraints and optional light heuristics.

### Tier 1 — Hard-banned (linter-enforced)

**A. Punctuation & formatting**
- The **em dash** character (`—`) — the single most-cited AI tell. Use commas, periods, or parentheses instead. Total ban in generated output.
- **Emoji used as bullets / line anchors** (e.g. a line starting with ✅ 🚀 💡 👉 🔥 ✨ ➡️).
- **Rocket 🚀 / sparkles ✨** anywhere in a professional post.
- **Markdown emphasis** — `**bold**`, `*italics*`, `#` headers, backticks (already disallowed; keep).
- **Hashtag stuffing** — cap at 0–3, only when genuinely natural; default 0.
- **Staccato line blocks** — 3+ consecutive ultra-short (≤4-word) lines used for false drama.

**B. Opener clichés**
- "In today's [fast-paced / rapidly evolving / digital / ever-changing] world / landscape / age"
- "In a world where…", "We live in a world where…"
- "Let's face it", "Let's be honest", "Picture this:", "Imagine a…"
- "[X] isn't just a buzzword", "[X] is more than a buzzword"
- "Excited to share", "Thrilled to announce", "Humbled and honored to…"

**C. Structural cliché phrases**
- **Negative parallelism:** "It's not X, it's Y" / "It's not just X, it's Y" (the #1 flagged construction)
- "Here's the thing", "Here's the kicker", "Here's where it gets interesting", "But here's the catch"
- Rhetorical one-word-question fragments: "The result?", "The best part?", "The kicker?", "The lesson?"
- "Let that sink in", "Read that again", "Sound familiar?"
- "At the end of the day", "When all is said and done"
- "Plot twist:", "Spoiler alert:", "Little did I know", "And honestly?"

**D. Verb inflation & buzzword vocabulary** (whole-word match)
- delve, leverage (as verb), unlock, unleash, harness, elevate, supercharge, revolutionize, game-changer, game-changing, tapestry, nestled, testament, realm, foster, bolster, robust, seamless, cutting-edge, synergy, paradigm, meticulous, pivotal, "move the needle", "double down", "level up"
- Figurative "landscape", "ecosystem", "navigate", "journey" (when not literal)
- Meta-commentary: "It's important to note", "It's worth noting", "Needless to say", "Rest assured", "In essence", "Indeed"
- Empty intensifiers: "truly", "incredibly", "absolutely", misused "literally"

**E. Engagement-bait CTAs**
- Standalone closers: "Agree?", "Thoughts?", "Am I wrong?", "Who's with me?"
- "Comment [X] below", "Drop a [emoji] in the comments", "Like and share", "Repost if…", "Follow me for more", "DM me 'WORD'"
- "P.S. [growth hack]" tacked-on closers

### Tier 2 — Structural / tonal (prompt-enforced)

- **Reflexive rule of three** — always listing exactly three items, whether or not three is accurate.
- **Forced redemption arc** — every setback ends in a tidy silver-lining lesson.
- **Relentless uniform positivity** — same hype energy for everything.
- **Manufactured vulnerability** — "I'll be honest", "Real talk", "Let me be vulnerable for a second".
- **Meta-summary** — restating the point right after making it; a conclusion that just rewords the opening.
- **Vague significance without specifics** — "this changes everything", "significant improvements", "game-changing results" with no concrete detail.
- **Question-restating** — repeating the topic as a question before answering it.

---

## 4. Ready-to-paste instruction block (`SLOP_INSTRUCTIONS`)

Store this as one exported constant in the new shared module (§5.1) and inject it into the system prompts of Calls 2, 3, 4, and 5. Wording is deliberately imperative and concrete:

```
HARD RULES — never violate, even if the style profile or the founder's take suggests otherwise:

Punctuation & formatting:
- Never use the em dash (—). Use commas, periods, or parentheses.
- Never use emoji as bullets or line starts. Never use the rocket or sparkles emoji.
- No markdown (no **bold**, *italics*, # headers, or `code`).
- No hashtag stuffing (0 by default; at most a few only if genuinely natural).
- Do not stack 3+ ultra-short lines for fake drama.

Banned openers:
- Never open with "In today's [fast-paced/rapidly evolving/digital] world/landscape",
  "In a world where", "Let's face it", "Picture this", "Imagine a", "[X] isn't just a buzzword",
  or announcement clichés like "Excited to share" / "Humbled and honored".

Banned phrases and constructions:
- Never use "It's not X, it's Y" or "It's not just X, it's Y".
- Never use "Here's the thing", "Here's the kicker", "Here's where it gets interesting",
  "The result?", "The best part?", "Let that sink in", "Read that again", "At the end of the day",
  "Plot twist", "Spoiler alert", "Little did I know", "Sound familiar?".
- Never use meta-commentary: "It's important to note", "It's worth noting", "Needless to say", "In essence".

Banned vocabulary (find a plain word instead):
- delve, leverage, unlock, unleash, harness, elevate, supercharge, revolutionize, game-changer,
  tapestry, nestled, testament, realm, foster, bolster, robust, seamless, cutting-edge, synergy,
  paradigm, meticulous, pivotal, "move the needle", figurative "landscape"/"journey"/"ecosystem",
  and empty intensifiers (truly, incredibly, absolutely).

Banned CTAs:
- Never close with "Agree?", "Thoughts?", "Comment X below", "Like and share", "Repost if",
  "Follow me for more", or "DM me 'WORD'".

Structure & tone:
- Do not force everything into a list of three. Do not force a tidy silver-lining lesson onto every setback.
- Do not manufacture vulnerability ("I'll be honest", "Real talk"). Do not restate your point after making it.
- Be specific and concrete. Replace vague significance ("this changes everything", "huge improvements")
  with the actual detail. Vary sentence length like a real person.
```

---

## 5. Solution architecture

### 5.1 New shared module — `convex/lib/slopFilter.ts`

Single source of truth so the rules stay DRY and tunable in one place (mirrors how prompts live in `postPrompts.ts`). Exports:

- `SLOP_INSTRUCTIONS: string` — the block from §4.
- `BANNED_PATTERNS: { id: string; label: string; test: RegExp; tier: 1 }[]` — the Tier-1 detectors (punctuation, opener/phrase regexes, `\b`-bounded vocabulary, CTA regexes).
- `lintSlop(text: string): Violation[]` — runs every Tier-1 pattern, returns matches with `{ id, label, matchedText }`.
- `scrubHardTokens(text: string): string` — conservative last-resort cleaner (see §5.4).
- `describeViolations(v: Violation[]): string` — turns violations into a short natural-language note for the repair prompt.

### 5.2 Prevent — prompt hardening

- **Call 4 (generation) — `CALL4_SYSTEM` in `postPrompts.ts`:** append `SLOP_INSTRUCTIONS`. This is the primary intervention.
- **Call 2 (style samples) — see §6.** The "flashy" and "preachy" voice definitions currently *instruct slop* (hype/superlatives; moralizing imperatives). Fix them, and append `SLOP_INSTRUCTIONS`.
- **Call 3 (style synthesis):** append a rule — "Never encode any banned pattern as a directive, even if the founder's writing sample contains one. Describe their voice in terms of legitimate craft, not slop mechanics." Then append `SLOP_INSTRUCTIONS`.
- **Call 5 (profile update on finalize):** append a rule — "When learning from edits, never add a directive that reintroduces a banned pattern." Then append `SLOP_INSTRUCTIONS`.
- Keep `prompt-engineering.md` in sync (it mirrors the prompts 1:1).

### 5.3 Detect + Repair — wire into `generatePost` and `regeneratePostAction` (`postActions.ts`)

Replace the single `chatCompletion` call with a helper, e.g. `generateCleanDraft(params)`:

```
1. draft = chatCompletion(Call4)               // existing call
2. violations = lintSlop(draft)
3. if violations not empty:
     repairNote = describeViolations(violations)
     draft = chatCompletion(Call4 + repairNote) // ONE silent retry, violations fed back
     violations = lintSlop(draft)
4. if violations still not empty:
     draft = scrubHardTokens(draft)             // deterministic last resort (§5.4)
5. return draft
```

- **Retry budget: exactly 1.** Bounds cost/latency; worst case is 2 generation calls, expected ~1.1x once the prompt is hardened.
- The repair note is appended to the Call-4 **user** prompt (add an optional `repairNote` field to `call4User` in `postPrompts.ts`), e.g. *"Your previous draft used these banned patterns: [list]. Rewrite the post without any of them, keeping the same topic and take."*
- Optionally drop temperature slightly on the repair pass (e.g. 0.8 → 0.65) for tighter compliance.
- The linter runs **only on AI output**, never on the founder's manual edits (see §7).

### 5.4 `scrubHardTokens` — conservative last resort

Only deterministic edits that cannot break grammar:
- Replace `—` with `, ` (or remove) and collapse spacing.
- Strip leading bullet emoji from lines.
- Delete a trailing engagement-bait CTA line if it exactly matches a Tier-1 E pattern.
- **Do not** auto-substitute vocabulary or rewrite phrases in code (risks broken sentences) — those rely on prevention + the one regeneration. If phrase/vocab violations survive the retry, log them (§8) rather than mangling the text.

---

## 6. Fix the slop-generating voices (Call 2) — important

In `prompt-engineering.md` / the Call-2 system prompt, two of the five onboarding voices literally teach the model to write slop, and that slop then gets baked into the founder's living style profile via Call 3:

- **flashy** — currently "bold claims, big numbers/superlatives, high-energy hype language."
- **preachy** — currently "didactic and moralizing… imperative language ('you need to…', 'stop doing…')."

If a founder picks either during onboarding, every future post is slop by design. **Fix:** keep the labels (they're user-facing in `StepStyleSelection`), but rewrite the definitions to their legitimate core and strip the slop mechanics:

- **flashy →** "bold, high-conviction, punchy — strong claims stated plainly, **without** superlatives, invented big numbers, or hype words."
- **preachy →** "instructive and opinionated — teaches a clear point of view, **without** moralizing, lecturing, or 'you need to stop…' commands."

The other three (contrarian, humble, conversational) are fine as-is.

---

## 7. Rule for the learning loop (resolves a real conflict)

A founder may legitimately *like* a pattern the blocklist bans (some people genuinely write with em dashes). Resolution:

- The blocklist governs **generation only**. It is a floor for AI output.
- The founder's **manual edits are never touched** — their finalized post keeps whatever they typed.
- **Call 5 will not encode a banned pattern as a directive**, even if it appears in the founder's edit. This keeps the style profile clean and prevents churn (profile says "add em dash" → linter strips it → profile relearns it → …).

State this explicitly so the implementing agent doesn't run the linter over `finalContent`.

---

## 8. Measurement (mostly from existing data)

The `posts` table already stores `generatedContent`, `finalContent`, regenerate history, and `finalizedAt`. Derive:

- **Zero-edit finalize rate** (north star) — `finalContent === generatedContent` over finalized posts. The finalize path already special-cases this equality, so it's free to compute.
- **Draft→final edit distance** — normalized word-level diff; lower = more usable.
- **Regenerations per finalized post** — high = not usable.
- **First-pass lint rate** (new telemetry) — add an optional `slopViolationCount` field on the post at generation time (count from the *first* Call-4 draft, before repair). Cheap to add, high signal: it tells you how often prevention is working vs. leaning on repair.

Targets to set after a baseline: first-pass lint rate >90%, zero-edit finalize rate trending up week over week.

---

## 9. Rollout & priority

- **P0 (highest ROI, ship first):** `slopFilter.ts` (instructions + linter + scrub) · append `SLOP_INSTRUCTIONS` to Call 4 · detect+repair flow in `generatePost` and `regeneratePostAction` · fix Call-2 voice definitions. This alone makes output dramatically cleaner.
- **P1:** propagate rules to Call 3 and Call 5 · add `slopViolationCount` telemetry · a Convex query exposing the zero-edit rate.
- **P2:** move the blocklist to config (DB/env) for no-deploy tuning · optional dedicated "humanize" critique pass behind a flag (note: it's a 2nd LLM call, weigh against the one-call-per-action convention) · heuristic detectors for Tier-2 structural patterns.

---

## 10. Open decisions (for Krishna / Aaryav)

1. **Em dash:** total ban in generation (recommended — strongest single tell; founders can still add manually) vs. allow ≤1?
2. **Repair cost:** accept the worst-case +1 generation call for compliance? (Recommended: yes, capped at 1 retry.)
3. **Voice labels:** keep "flashy/preachy" labels with cleaned definitions (recommended) vs. rename?
4. **Hashtags:** 0 by default (recommended) or allow up to 3?
5. **Learning-loop rule** in §7 — confirm blocklist governs generation while the founder's own edits are untouched.

---

## 11. Non-goals

- No change to the 5-call architecture or the one-LLM-call-per-action convention (except the single bounded repair retry).
- No schema migration for P0 (the `slopViolationCount` field in P1 is additive/optional).
- No new UI screens. No auth, media, scheduling, or model-per-call routing.
- Not touching the founder's manually edited final text — ever.
