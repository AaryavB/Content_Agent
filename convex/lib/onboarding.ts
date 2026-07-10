export const STYLE_LABELS = [
  "contrarian",
  "humble",
  "flashy",
  "preachy",
  "conversational",
] as const;

export function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export function normalizeTopics(topics: string[]): string[] {
  return topics.map((topic) => topic.trim()).filter((topic) => topic.length > 0);
}

export function validateTopics(topics: string[]): string[] {
  const normalized = normalizeTopics(topics);
  if (normalized.length < 3 || normalized.length > 4) {
    throw new Error("Please provide 3-4 topics.");
  }
  return normalized;
}

export function validateStyleProfileInput(
  selectedStyles: string[],
  userWritingSample: string | undefined,
  sampleWritingWeight: number,
): void {
  const normalizedStyles = selectedStyles.map((style) => style.trim()).filter(Boolean);
  const hasSample = Boolean(userWritingSample?.trim());

  if (hasSample) {
    if (normalizedStyles.length !== 1) {
      throw new Error(
        "When providing your own writing sample, select exactly 1 style.",
      );
    }
    if (sampleWritingWeight !== 0.75) {
      throw new Error(
        "Sample writing weight must be 0.75 when user writing sample is provided.",
      );
    }
    return;
  }

  if (normalizedStyles.length < 1 || normalizedStyles.length > 2) {
    throw new Error(
      "Select 1-2 styles when not providing your own writing sample.",
    );
  }
  if (sampleWritingWeight !== 0) {
    throw new Error(
      "Sample writing weight must be 0 when no user writing sample is provided.",
    );
  }
}
