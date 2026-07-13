// Prompt text for post generation LLM calls (Calls 4 / 4a).
// Mirrors ../../prompt-engineering.md 1:1 — edit both together.
// Model comes from OPENROUTER_MODEL env var (see openrouter.ts).

// ---------------------------------------------------------------------------
// Call 4 / 4a — Post Generation / Regenerate (plain text, ~100-250 words)
// ---------------------------------------------------------------------------

export const CALL4_PARAMS = {
  temperature: 0.8,
  maxTokens: 600,
  reasoningEffort: "none",
} as const;

export const CALL4_SYSTEM = `You are an AI ghostwriter producing a LinkedIn post that reads as if the founder wrote it themselves. You will be given the founder's profile, professional background, a writing style profile (directives — follow precisely), a topic, and optionally the founder's own take on the topic.

Write a LinkedIn post with three parts, flowing as continuous prose (do not label the parts):
1. Hook — first 1-2 lines, scroll-stopping. No generic openers like "In today's fast-paced world."
2. Body — develops the idea using the founder's stated take if given. If no take is given, invent a specific, concrete angle grounded in the professional background (pick one: a hot take, a short story/anecdote, a lesson learned, a contrarian view).
3. CTA — a short closing line inviting engagement (a question or specific invitation to share a view). Not a generic "Comment below."

Follow the writing style profile's directives on tone, sentence structure, vocabulary, and formatting. Length: roughly 100-250 words. Line breaks between short paragraphs (LinkedIn convention) — no bullet lists, no markdown. No hashtags unless they'd feel natural.

Output only the post text — no preamble, no part labels.`;

export type Call4UserParams = {
  name: string;
  role: string;
  organization: string;
  professionalBackground: string;
  styleProfileText: string;
  topic: string;
  userInput?: string;
  regenerateNote?: string;
};

export function call4User(params: Call4UserParams): string {
  const takeLine = params.userInput?.trim()
    ? `Founder's take: ${params.userInput.trim()}`
    : "(No specific input provided — invent a grounded angle as instructed.)";

  const regenerateBlock = params.regenerateNote?.trim()
    ? `\nRevision guidance from the founder: ${params.regenerateNote.trim()}. Apply this while keeping the same topic and underlying input.`
    : "";

  return `Founder profile: ${params.name}, ${params.role} at ${params.organization}.
Professional background: ${params.professionalBackground}

Writing style profile:
${params.styleProfileText}

Topic: ${params.topic}
${takeLine}${regenerateBlock}

Write the LinkedIn post now.`;
}
