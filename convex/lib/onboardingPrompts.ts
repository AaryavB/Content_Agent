// Prompt text for the 3 onboarding LLM calls (Calls 1-3).
// Mirrors ../../prompt-engineering.md 1:1 — edit both together.
// Model comes from OPENROUTER_MODEL env var (see openrouter.ts), so these are
// model-agnostic. Word caps in the prompts are a first line of defense only;
// the calling actions hard-truncate with truncateToWords as the real safety net.

// ---------------------------------------------------------------------------
// Call 1 — Background Inference (plain text, max 150 words)
// ---------------------------------------------------------------------------

export const CALL1_PARAMS = {
  temperature: 0.3,
  maxTokens: 600,
  reasoningEffort: "none",
} as const;

export const CALL1_SYSTEM = `You are a precise editor who extracts professional background summaries from raw LinkedIn text.

Given a block of pasted LinkedIn content (About section, Experience entries, or similar), extract: industry, professional background, key achievements, roles held, and any other professionally relevant context. Exclude irrelevant personal details (hobbies, personal life, unrelated volunteering) unless they clearly convey professional identity.

Write a concise third-person summary in plain prose. No bullet points, no headers. Maximum 150 words.

Output only the summary — no preamble, no explanation, no quotation marks.`;

export function call1User(linkedinPaste: string): string {
  return `LinkedIn paste:
"""
${linkedinPaste}
"""

Write the professional background summary now.`;
}

// ---------------------------------------------------------------------------
// Call 2 — Style Sample Generation (JSON, 5 samples, one per style)
// ---------------------------------------------------------------------------

// Reasoning disabled: minimax-m3 spends hidden tokens on thinking, which
// truncated Call 2 JSON at 700 max_tokens. 2500 leaves room for 5 paragraphs.
export const CALL2_PARAMS = {
  temperature: 0.9,
  maxTokens: 2500,
  reasoningEffort: "none",
} as const;

export const CALL2_SYSTEM = `You are a versatile LinkedIn ghostwriter. Given a single topic, write the SAME core idea as 5 short one-paragraph LinkedIn post openers, one in each of these 5 distinct voices:

1. contrarian — challenges the conventional/obvious take; defensible but unpopular stance; confident, slightly combative tone.
2. humble — modest, credits others or luck, downplays personal authority, soft hedging language.
3. flashy — bold, high-conviction, punchy; strong claims stated plainly, without superlatives, invented big numbers, or hype words.
4. preachy — instructive and opinionated; teaches a clear point of view, without moralizing, lecturing, or "you need to stop…" commands.
5. conversational — casual, first-person, like talking to a friend over coffee; contractions, rhetorical questions, informal punctuation.

Each sample: ONE paragraph (3-5 sentences), expresses the same underlying idea about the topic, and clearly sounds different from the other four.

Respond with ONLY valid JSON in this exact shape, no markdown code fences, no commentary:
{"samples":[{"style":"contrarian","content":"..."},{"style":"humble","content":"..."},{"style":"flashy","content":"..."},{"style":"preachy","content":"..."},{"style":"conversational","content":"..."}]}`;

export function call2User(topic: string): string {
  return `Topic: ${topic}

Generate the 5 samples now.`;
}

// ---------------------------------------------------------------------------
// Call 3 — Style Profile Synthesis (plain text, max 200 words)
// ---------------------------------------------------------------------------

export const CALL3_PARAMS = {
  temperature: 0.4,
  maxTokens: 800,
  reasoningEffort: "none",
} as const;

export const CALL3_SYSTEM = `You are a writing-style analyst. Produce a Writing Style Profile that will be injected into future prompts as directives for an AI ghostwriter to follow — write actionable rules, not vague description. ("Uses short punchy sentences, opens with a direct claim, avoids hedging language" — not "the writing is confident.")

Cover: tone, sentence structure, vocabulary patterns, formatting habits (line breaks, emoji use, punctuation quirks), and thinking patterns (how arguments are framed, what's emphasized, what's avoided).

You will be given one or two selected style labels, optionally a writing sample the user wrote themselves, and a weighting:
- If a user writing sample is provided: weight it at 75% and the single selected style at 25%. Ground the profile primarily in patterns observable in the sample; use the selected style only to refine tone.
- If no writing sample is provided: weight the one or two selected styles equally.

Maximum 200 words. Output only the profile text — no headers, no preamble.`;

export function call3User(
  selectedStyles: string[],
  userWritingSample: string | undefined,
  sampleWritingWeight: number,
): string {
  const hasSample = Boolean(userWritingSample?.trim());
  const weightingLine =
    sampleWritingWeight === 0.75
      ? "75% user sample / 25% selected style"
      : "selected style(s) equally weighted";

  const sampleBlock = hasSample
    ? `User's own writing sample (weight 75%):
"""
${userWritingSample!.trim()}
"""
`
    : "";

  return `Selected style(s): ${selectedStyles.join(", ")}
${sampleBlock}Weighting: ${weightingLine}

Write the Writing Style Profile now.`;
}
