// Anti-slop enforcement layer — single source of truth for banned patterns.
// See ../../anti-slop-spec.md for the full product spec.

export const SLOP_INSTRUCTIONS = `HARD RULES — never violate, even if the style profile or the founder's take suggests otherwise:

Punctuation & formatting:
- Never use the em dash (—). Use commas, periods, or parentheses.
- Never use emoji as bullets or line starts. Never use the rocket or sparkles emoji.
- No markdown (no **bold**, *italics*, # headers, or \`code\`).
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
  with the actual detail. Vary sentence length like a real person.`;

export type Violation = {
  id: string;
  label: string;
  matchedText: string;
};

export type BannedPattern = {
  id: string;
  label: string;
  test: RegExp;
  tier: 1;
};

const BULLET_EMOJI =
  /^(?:✅|🚀|💡|👉|🔥|✨|➡️|📌|💪|🎯|⚡|🌟|👇|☑️|✔️|🔑|💬|📢|🏆)\s*/u;

const CTA_LINE_PATTERNS: RegExp[] = [
  /^Agree\?$/i,
  /^Thoughts\?$/i,
  /^Am I wrong\?$/i,
  /^Who'?s with me\?$/i,
  /^Comment .+ below\.?$/i,
  /^Drop a .+ in the comments\.?$/i,
  /^Like and share\.?$/i,
  /^Repost if .+$/i,
  /^Follow me for more\.?$/i,
  /^DM me ['"].+['"]\.?$/i,
];

function pattern(
  id: string,
  label: string,
  source: string,
  flags = "i",
): BannedPattern {
  return { id, label, test: new RegExp(source, flags), tier: 1 };
}

export const BANNED_PATTERNS: BannedPattern[] = [
  // A. Punctuation & formatting
  pattern("em-dash", "em dash", "—"),
  pattern("en-dash", "en dash", "–"),
  pattern("markdown-bold", "markdown bold", "\\*\\*[^*]+\\*\\*"),
  pattern("markdown-italic", "markdown italics", "(?<!\\*)\\*[^*\\n]+\\*(?!\\*)"),
  pattern("markdown-header", "markdown header", "^#+\\s", "im"),
  pattern("markdown-code", "markdown code", "`[^`\\n]+`"),
  pattern("emoji-rocket", "rocket emoji", "🚀"),
  pattern("emoji-sparkles", "sparkles emoji", "✨"),
  pattern(
    "emoji-bullet-line",
    "emoji used as line anchor",
    "^(?:✅|🚀|💡|👉|🔥|✨|➡️|📌|💪|🎯|⚡|🌟|👇|☑️|✔️|🔑|💬|📢|🏆)",
    "mu",
  ),

  // B. Opener clichés
  pattern(
    "opener-todays-world",
    'opener "In today\'s … world/landscape"',
    "\\bIn today'?s\\s+(?:fast[- ]paced|rapidly evolving|digital|ever[- ]changing)\\s+(?:world|landscape|age)\\b",
  ),
  pattern(
    "opener-in-a-world",
    'opener "In a world where"',
    "\\b(?:In a world where|We live in a world where)\\b",
  ),
  pattern(
    "opener-lets-face-it",
    'opener "Let\'s face it / Let\'s be honest"',
    "\\bLet'?s (?:face it|be honest)\\b",
  ),
  pattern(
    "opener-picture-this",
    'opener "Picture this"',
    "\\bPicture this:?\\b",
  ),
  pattern(
    "opener-imagine-a",
    'opener "Imagine a"',
    "\\bImagine a\\b",
  ),
  pattern(
    "opener-buzzword",
    "opener buzzword cliché",
    "\\bisn'?t (?:just )?a buzzword\\b",
  ),
  pattern(
    "opener-excited",
    'announcement opener "Excited to share"',
    "\\bExcited to share\\b",
  ),
  pattern(
    "opener-thrilled",
    'announcement opener "Thrilled to announce"',
    "\\bThrilled to announce\\b",
  ),
  pattern(
    "opener-humbled",
    'announcement opener "Humbled and honored"',
    "\\bHumbled and honored\\b",
  ),

  // C. Structural cliché phrases
  pattern(
    "negative-parallelism",
    'negative parallelism "It\'s not X, it\'s Y"',
    "\\bIt'?s not (?:just )?.+?,\\s*it'?s\\b",
  ),
  pattern(
    "heres-the-thing",
    '"Here\'s the thing"',
    "\\bHere'?s the thing\\b",
  ),
  pattern(
    "heres-the-kicker",
    '"Here\'s the kicker"',
    "\\bHere'?s the kicker\\b",
  ),
  pattern(
    "heres-where-interesting",
    '"Here\'s where it gets interesting"',
    "\\bHere'?s where it gets interesting\\b",
  ),
  pattern(
    "heres-the-catch",
    '"But here\'s the catch"',
    "\\b(?:But )?here'?s the catch\\b",
  ),
  pattern(
    "rhetorical-result",
    'rhetorical fragment "The result?"',
    "\\bThe result\\?(?:\\s|$)",
  ),
  pattern(
    "rhetorical-best-part",
    'rhetorical fragment "The best part?"',
    "\\bThe best part\\?(?:\\s|$)",
  ),
  pattern(
    "rhetorical-kicker",
    'rhetorical fragment "The kicker?"',
    "\\bThe kicker\\?(?:\\s|$)",
  ),
  pattern(
    "rhetorical-lesson",
    'rhetorical fragment "The lesson?"',
    "\\bThe lesson\\?(?:\\s|$)",
  ),
  pattern(
    "let-that-sink-in",
    '"Let that sink in"',
    "\\bLet that sink in\\b",
  ),
  pattern(
    "read-that-again",
    '"Read that again"',
    "\\bRead that again\\b",
  ),
  pattern(
    "sound-familiar",
    '"Sound familiar?"',
    "\\bSound familiar\\?(?:\\s|$)",
  ),
  pattern(
    "at-end-of-day",
    '"At the end of the day"',
    "\\bAt the end of the day\\b",
  ),
  pattern(
    "when-all-said",
    '"When all is said and done"',
    "\\bWhen all is said and done\\b",
  ),
  pattern(
    "plot-twist",
    '"Plot twist"',
    "\\bPlot twist:?\\b",
  ),
  pattern(
    "spoiler-alert",
    '"Spoiler alert"',
    "\\bSpoiler alert:?\\b",
  ),
  pattern(
    "little-did-i-know",
    '"Little did I know"',
    "\\bLittle did I know\\b",
  ),
  pattern(
    "and-honestly",
    '"And honestly?"',
    "\\bAnd honestly\\?(?:\\s|$)",
  ),

  // D. Meta-commentary
  pattern(
    "important-to-note",
    '"It\'s important to note"',
    "\\bIt'?s important to note\\b",
  ),
  pattern(
    "worth-noting",
    '"It\'s worth noting"',
    "\\bIt'?s worth noting\\b",
  ),
  pattern(
    "needless-to-say",
    '"Needless to say"',
    "\\bNeedless to say\\b",
  ),
  pattern(
    "rest-assured",
    '"Rest assured"',
    "\\bRest assured\\b",
  ),
  pattern(
    "in-essence",
    '"In essence"',
    "\\bIn essence\\b",
  ),
  pattern(
    "indeed-meta",
    'meta "Indeed"',
    "\\bIndeed[,\\.]\\b",
  ),

  // D. Buzzword vocabulary (whole-word)
  pattern("vocab-delve", "buzzword: delve", "\\bdelve\\b"),
  pattern("vocab-leverage", "buzzword: leverage", "\\bleverage\\b"),
  pattern("vocab-unlock", "buzzword: unlock", "\\bunlock\\b"),
  pattern("vocab-unleash", "buzzword: unleash", "\\bunleash\\b"),
  pattern("vocab-harness", "buzzword: harness", "\\bharness\\b"),
  pattern("vocab-elevate", "buzzword: elevate", "\\belevate\\b"),
  pattern("vocab-supercharge", "buzzword: supercharge", "\\bsupercharge\\b"),
  pattern(
    "vocab-revolutionize",
    "buzzword: revolutionize",
    "\\brevolutioniz(?:e|es|ed|ing)\\b",
  ),
  pattern(
    "vocab-game-changer",
    "buzzword: game-changer",
    "\\bgame[- ]chang(?:er|ing)\\b",
  ),
  pattern("vocab-tapestry", "buzzword: tapestry", "\\btapestry\\b"),
  pattern("vocab-nestled", "buzzword: nestled", "\\bnestled\\b"),
  pattern("vocab-testament", "buzzword: testament", "\\btestament\\b"),
  pattern("vocab-realm", "buzzword: realm", "\\brealm\\b"),
  pattern("vocab-foster", "buzzword: foster", "\\bfoster\\b"),
  pattern("vocab-bolster", "buzzword: bolster", "\\bbolster\\b"),
  pattern("vocab-robust", "buzzword: robust", "\\brobust\\b"),
  pattern("vocab-seamless", "buzzword: seamless", "\\bseamless\\b"),
  pattern(
    "vocab-cutting-edge",
    "buzzword: cutting-edge",
    "\\bcutting[- ]edge\\b",
  ),
  pattern("vocab-synergy", "buzzword: synergy", "\\bsynergy\\b"),
  pattern("vocab-paradigm", "buzzword: paradigm", "\\bparadigm\\b"),
  pattern("vocab-meticulous", "buzzword: meticulous", "\\bmeticulous\\b"),
  pattern("vocab-pivotal", "buzzword: pivotal", "\\bpivotal\\b"),
  pattern(
    "vocab-move-the-needle",
    "buzzword: move the needle",
    "\\bmove the needle\\b",
  ),
  pattern(
    "vocab-double-down",
    "buzzword: double down",
    "\\bdouble down\\b",
  ),
  pattern("vocab-level-up", "buzzword: level up", "\\blevel up\\b"),
  pattern(
    "vocab-landscape",
    "figurative buzzword: landscape",
    "\\blandscape\\b",
  ),
  pattern(
    "vocab-ecosystem",
    "figurative buzzword: ecosystem",
    "\\becosystem\\b",
  ),
  pattern(
    "vocab-navigate",
    "figurative buzzword: navigate",
    "\\bnavigate\\b",
  ),
  pattern("vocab-journey", "figurative buzzword: journey", "\\bjourney\\b"),
  pattern("vocab-truly", "empty intensifier: truly", "\\btruly\\b"),
  pattern(
    "vocab-incredibly",
    "empty intensifier: incredibly",
    "\\bincredibly\\b",
  ),
  pattern(
    "vocab-absolutely",
    "empty intensifier: absolutely",
    "\\babsolutely\\b",
  ),
  pattern(
    "vocab-literally",
    "misused intensifier: literally",
    "\\bliterally\\b",
  ),

  // E. Engagement-bait CTAs (inline — trailing-line scrub uses CTA_LINE_PATTERNS)
  pattern("cta-agree", 'engagement bait "Agree?"', "\\bAgree\\?(?:\\s|$)"),
  pattern("cta-thoughts", 'engagement bait "Thoughts?"', "\\bThoughts\\?(?:\\s|$)"),
  pattern(
    "cta-am-i-wrong",
    'engagement bait "Am I wrong?"',
    "\\bAm I wrong\\?(?:\\s|$)",
  ),
  pattern(
    "cta-whos-with-me",
    'engagement bait "Who\'s with me?"',
    "\\bWho'?s with me\\?(?:\\s|$)",
  ),
  pattern(
    "cta-comment-below",
    'engagement bait "Comment X below"',
    "\\bComment .+ below\\b",
  ),
  pattern(
    "cta-drop-emoji",
    "engagement bait: drop emoji in comments",
    "\\bDrop a .+ in the comments\\b",
  ),
  pattern(
    "cta-like-share",
    'engagement bait "Like and share"',
    "\\bLike and share\\b",
  ),
  pattern("cta-repost-if", 'engagement bait "Repost if"', "\\bRepost if\\b"),
  pattern(
    "cta-follow-me",
    'engagement bait "Follow me for more"',
    "\\bFollow me for more\\b",
  ),
  pattern(
    "cta-dm-me",
    'engagement bait "DM me WORD"',
    "\\bDM me ['\"].+['\"]\\b",
  ),
  pattern(
    "cta-ps-growth",
    "P.S. growth-hack closer",
    "\\bP\\.?S\\.?\\s+(?:if you|follow|like|share|comment|dm)\\b",
  ),
];

function detectHashtagStuffing(text: string): Violation | null {
  const hashtags = text.match(/#\w+/g);
  if (hashtags && hashtags.length > 3) {
    return {
      id: "hashtag-stuffing",
      label: "hashtag stuffing (more than 3)",
      matchedText: hashtags.slice(0, 4).join(", "),
    };
  }
  return null;
}

function detectStaccatoBlocks(text: string): Violation | null {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  let consecutive = 0;
  let blockStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const wordCount = lines[i].split(/\s+/).filter(Boolean).length;
    if (wordCount <= 4) {
      if (consecutive === 0) {
        blockStart = i;
      }
      consecutive++;
      if (consecutive >= 3) {
        const matchedText = lines.slice(blockStart, i + 1).join(" / ");
        return {
          id: "staccato-block",
          label: "staccato line block (3+ ultra-short lines)",
          matchedText,
        };
      }
    } else {
      consecutive = 0;
    }
  }

  return null;
}

export function lintSlop(text: string): Violation[] {
  const violations: Violation[] = [];
  const seenIds = new Set<string>();

  function add(violation: Violation) {
    if (!seenIds.has(violation.id)) {
      seenIds.add(violation.id);
      violations.push(violation);
    }
  }

  for (const banned of BANNED_PATTERNS) {
    const match = banned.test.exec(text);
    if (match) {
      add({
        id: banned.id,
        label: banned.label,
        matchedText: match[0],
      });
    }
    banned.test.lastIndex = 0;
  }

  const hashtagViolation = detectHashtagStuffing(text);
  if (hashtagViolation) {
    add(hashtagViolation);
  }

  const staccatoViolation = detectStaccatoBlocks(text);
  if (staccatoViolation) {
    add(staccatoViolation);
  }

  return violations;
}

export function describeViolations(violations: Violation[]): string {
  return violations
    .map((v) => `${v.label} (matched: "${v.matchedText}")`)
    .join("; ");
}

function isEngagementBaitLine(line: string): boolean {
  const trimmed = line.trim();
  return CTA_LINE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function scrubHardTokens(text: string): string {
  let result = text
    .replace(/[—–]/g, ", ")
    .replace(/ {2,}/g, " ")
    .replace(/ ,/g, ",");

  result = result
    .split("\n")
    .map((line) => line.replace(BULLET_EMOJI, ""))
    .join("\n");

  const lines = result.split("\n");
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1]?.trim() ?? "";
    if (lastLine && isEngagementBaitLine(lastLine)) {
      lines.pop();
    } else {
      break;
    }
  }

  return lines.join("\n").trim();
}
