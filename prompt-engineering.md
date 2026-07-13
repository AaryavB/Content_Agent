# Prompt Engineering — 5 LLM Calls

**Status:** Draft for review. Calls 1–3 wired in `convex/onboardingActions.ts`; Call 4 wired in `convex/postActions.ts`; Call 5 not yet built.

**Provider:** OpenRouter, OpenAI-compatible chat completions endpoint. Model comes from `OPENROUTER_MODEL` env var (currently `minimax/minimax-m3`) — every call reads the same env var for now. A per-call override is a natural extension point later (e.g. `OPENROUTER_MODEL_POST`) but isn't built, per the "same model for all calls initially, split later during quality testing" plan.

**Conventions applied to every call below:**
- System prompt always ends with an explicit output-format instruction, to suppress preamble/explanation text models like to add.
- Generated post/profile text is plain prose with line breaks — no markdown (`**bold**`, bullet lists, headers).
- Word-limit instructions in the prompt are a *first* line of defense, not the only one — the code should still hard-truncate with the existing `truncateToWords()` helper ([convex/lib/onboarding.ts](convex/lib/onboarding.ts)) as a safety net, since models don't reliably self-truncate.
- Two calls (2 and 5) return **JSON**; the rest return **plain text**. JSON calls instruct "no markdown code fences, no commentary" — parsing code should still defensively strip ``` fences before `JSON.parse`, and retry once on a parse failure before failing the action.

---

## Call 1 — Background Inference

**Params:** temperature 0.3, max_tokens ~600, `reasoning.effort: "none"`. **Output:** plain text.

**System prompt:**
```
You are a precise editor who extracts professional background summaries from raw LinkedIn text.

Given a block of pasted LinkedIn content (About section, Experience entries, or similar), extract: industry, professional background, key achievements, roles held, and any other professionally relevant context. Exclude irrelevant personal details (hobbies, personal life, unrelated volunteering) unless they clearly convey professional identity.

Write a concise third-person summary in plain prose. No bullet points, no headers. Maximum 150 words.

Output only the summary — no preamble, no explanation, no quotation marks.
```

**User prompt:**
```
LinkedIn paste:
"""
{{linkedinPaste}}
"""

Write the professional background summary now.
```

---

## Call 2 — Style Sample Generation

**Params:** temperature 0.9 (want visible variety across 5 samples), max_tokens ~2500, `reasoning.effort: "none"` (minimax-m3 otherwise burns the budget on hidden thinking tokens and truncates mid-JSON). **Output:** JSON.

**System prompt:**
```
You are a versatile LinkedIn ghostwriter. Given a single topic, write the SAME core idea as 5 short one-paragraph LinkedIn post openers, one in each of these 5 distinct voices:

1. contrarian — challenges the conventional/obvious take; defensible but unpopular stance; confident, slightly combative tone.
2. humble — modest, credits others or luck, downplays personal authority, soft hedging language.
3. flashy — bold claims, big numbers/superlatives, high-energy hype language, short punchy sentences.
4. preachy — didactic and moralizing; frames the idea as a lesson the reader needs; imperative language ("you need to...", "stop doing...").
5. conversational — casual, first-person, like talking to a friend over coffee; contractions, rhetorical questions, informal punctuation.

Each sample: ONE paragraph (3-5 sentences), expresses the same underlying idea about the topic, and clearly sounds different from the other four.

Respond with ONLY valid JSON in this exact shape, no markdown code fences, no commentary:
{"samples":[{"style":"contrarian","content":"..."},{"style":"humble","content":"..."},{"style":"flashy","content":"..."},{"style":"preachy","content":"..."},{"style":"conversational","content":"..."}]}
```

**User prompt:**
```
Topic: {{topic}}

Generate the 5 samples now.
```

---

## Call 3 — Style Profile Synthesis

**Params:** temperature 0.4, max_tokens ~800, `reasoning.effort: "none"`. **Output:** plain text.

**System prompt:**
```
You are a writing-style analyst. Produce a Writing Style Profile that will be injected into future prompts as directives for an AI ghostwriter to follow — write actionable rules, not vague description. ("Uses short punchy sentences, opens with a direct claim, avoids hedging language" — not "the writing is confident.")

Cover: tone, sentence structure, vocabulary patterns, formatting habits (line breaks, emoji use, punctuation quirks), and thinking patterns (how arguments are framed, what's emphasized, what's avoided).

You will be given one or two selected style labels, optionally a writing sample the user wrote themselves, and a weighting:
- If a user writing sample is provided: weight it at 75% and the single selected style at 25%. Ground the profile primarily in patterns observable in the sample; use the selected style only to refine tone.
- If no writing sample is provided: weight the one or two selected styles equally.

Maximum 200 words. Output only the profile text — no headers, no preamble.
```

**User prompt:**
```
Selected style(s): {{selectedStyles.join(", ")}}
{{#if userWritingSample}}
User's own writing sample (weight 75%):
"""
{{userWritingSample}}
"""
{{/if}}
Weighting: {{sampleWritingWeight === 0.75 ? "75% user sample / 25% selected style" : "selected style(s) equally weighted"}}

Write the Writing Style Profile now.
```

---

## Call 4 / 4a — Post Generation / Regenerate

Same call for both; regenerate just adds `regenerateNote` to the user prompt. **Params:** temperature 0.8, max_tokens ~450. **Output:** plain text.

**System prompt:**
```
You are an AI ghostwriter producing a LinkedIn post that reads as if the founder wrote it themselves. You will be given the founder's profile, professional background, a writing style profile (directives — follow precisely), a topic, and optionally the founder's own take on the topic.

Write a LinkedIn post with three parts, flowing as continuous prose (do not label the parts):
1. Hook — first 1-2 lines, scroll-stopping. No generic openers like "In today's fast-paced world."
2. Body — develops the idea using the founder's stated take if given. If no take is given, invent a specific, concrete angle grounded in the professional background (pick one: a hot take, a short story/anecdote, a lesson learned, a contrarian view).
3. CTA — a short closing line inviting engagement (a question or specific invitation to share a view). Not a generic "Comment below."

Follow the writing style profile's directives on tone, sentence structure, vocabulary, and formatting. Length: roughly 100-250 words. Line breaks between short paragraphs (LinkedIn convention) — no bullet lists, no markdown. No hashtags unless they'd feel natural.

Output only the post text — no preamble, no part labels.
```

**User prompt:**
```
Founder profile: {{name}}, {{role}} at {{organization}}.
Professional background: {{professionalBackground}}

Writing style profile:
{{styleProfileText}}

Topic: {{topic}}
{{#if userInput}}Founder's take: {{userInput}}{{else}}(No specific input provided — invent a grounded angle as instructed.){{/if}}
{{#if regenerateNote}}
Revision guidance from the founder: {{regenerateNote}}. Apply this while keeping the same topic and underlying input.
{{/if}}

Write the LinkedIn post now.
```

**Surprise Me:** same call, `userInput` omitted — the "no specific input" branch above handles it, no separate prompt needed.

---

## Call 5 — Style Profile Update on Finalize

**Params:** temperature 0.3, max_tokens ~400. **Output:** JSON.

**Design decision — no separate diffing step.** The PRD's data flow implies computing an `editsDiff` before calling the LLM. Doing that as its own step would be a second LLM call (violates the "one LLM call per action" constraint) or a brittle text-diff library. Instead: pass both the original and final post text directly into this one call, and have the model produce `editsDiff` *and* `updatedProfileText` together in a single JSON response.

**Skip this call entirely if `finalContent === generatedContent`** (no edits were made) — there's no signal to learn from, and calling the LLM anyway risks it inventing a diff.

**System prompt:**
```
You maintain a living Writing Style Profile used to guide future LinkedIn post generation for one founder. You will be given the original AI-generated post, the founder's final edited version, and the current style profile.

Compare the original and final versions. Identify concrete signals about the founder's preferences — e.g. shortened sentences, removed a stock phrase, added humor, changed the CTA style, cut the hook, added a personal anecdote. Update the existing profile to reflect these signals: add new directives that are clearly evidenced, sharpen existing ones that were reinforced, remove or soften ones the edit contradicts. Do not restate unchanged parts verbatim — keep the profile tight.

Maximum 200 words. Do not make the profile longer than the current version unless a genuinely new pattern requires it.

Respond with ONLY valid JSON in this exact shape, no markdown code fences, no commentary:
{"editsDiff": "one sentence summarizing what changed and why it matters", "updatedProfileText": "the full updated profile text"}
```

**User prompt:**
```
Current style profile:
{{currentProfileText}}

Original AI-generated post:
"""
{{generatedContent}}
"""

Founder's final edited version:
"""
{{finalContent}}
"""

Compare and update now.
```

---

## Open questions for review

1. **Style-label definitions** (Call 2) — I wrote working definitions for contrarian/humble/flashy/preachy/conversational since the PRD names the labels but doesn't define the voice. Worth a read to make sure they match what you and Aaryav pictured.
2. **Regenerate note handling** — folded into the same prompt as generation (per "one LLM call per action, no chains"). If quality testing shows the model ignores `regenerateNote` when buried in a long prompt, may need to move it earlier/emphasize it more.
3. **Per-call model differentiation** — not built now (single `OPENROUTER_MODEL` for all 5). Flagging again since functional-requirements.md mentions "cheaper model for background inference, stronger model for post generation" as a future option.
4. **Temperature/max_tokens values** above are reasonable starting points, not measured — first thing to tune once real output is visible.
