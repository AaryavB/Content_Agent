import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  STYLE_LABELS,
  truncateToWords,
  validateStyleProfileInput,
} from "./lib/onboarding";
import { chatCompletion, chatCompletionJson } from "./lib/openrouter";
import {
  CALL1_PARAMS,
  CALL1_SYSTEM,
  CALL2_PARAMS,
  CALL2_SYSTEM,
  CALL3_PARAMS,
  CALL3_SYSTEM,
  call1User,
  call2User,
  call3User,
} from "./lib/onboardingPrompts";

type StyleSample = { style: (typeof STYLE_LABELS)[number]; content: string };

// LLM Call 1 — infer a concise professional background from a LinkedIn paste.
export const inferProfessionalBackground = action({
  args: {
    userId: v.id("users"),
    linkedinPaste: v.string(),
  },
  handler: async (ctx, args) => {
    const linkedinPaste = args.linkedinPaste.trim();
    if (linkedinPaste.length < 50) {
      throw new Error("LinkedIn paste must be at least 50 characters.");
    }

    const raw = await chatCompletion({
      system: CALL1_SYSTEM,
      user: call1User(linkedinPaste),
      ...CALL1_PARAMS,
    });

    // Hard-truncate: the prompt asks for <=150 words, but models don't reliably
    // self-limit, and this string bloats every future generation prompt.
    const professionalBackground = truncateToWords(raw, 150);

    await ctx.runMutation(api.users.updateProfessionalBackground, {
      userId: args.userId,
      professionalBackground,
    });

    return { professionalBackground };
  },
});

// LLM Call 2 — generate 5 one-paragraph samples, one per style label.
export const generateStyleSamples = action({
  args: { topic: v.string() },
  handler: async (_ctx, args) => {
    const topic = args.topic.trim();
    if (!topic) {
      throw new Error("Topic is required.");
    }

    const samples = await chatCompletionJson<StyleSample[]>(
      {
        system: CALL2_SYSTEM,
        user: call2User(topic),
        ...CALL2_PARAMS,
        responseFormatJson: true,
      },
      (parsed) => {
        const rawSamples = (parsed as { samples?: unknown })?.samples;
        if (!Array.isArray(rawSamples)) {
          throw new Error("Expected a `samples` array.");
        }

        // Rebuild by iterating our known labels so the result is always exactly
        // 5 items, correctly labeled and ordered, regardless of model ordering.
        return STYLE_LABELS.map((style) => {
          const match = rawSamples.find(
            (item): item is { style: string; content: string } =>
              typeof item === "object" &&
              item !== null &&
              (item as { style?: unknown }).style === style &&
              typeof (item as { content?: unknown }).content === "string",
          );

          const content = match?.content.trim();
          if (!content) {
            throw new Error(`Missing or empty sample for style "${style}".`);
          }

          return { style, content };
        });
      },
    );

    return { samples };
  },
});

// LLM Call 3 — synthesize the writing style profile from style selections.
export const synthesizeStyleProfile = action({
  args: {
    userId: v.id("users"),
    selectedStyles: v.array(v.string()),
    userWritingSample: v.optional(v.string()),
    sampleWritingWeight: v.number(),
  },
  handler: async (ctx, args) => {
    validateStyleProfileInput(
      args.selectedStyles,
      args.userWritingSample,
      args.sampleWritingWeight,
    );

    const raw = await chatCompletion({
      system: CALL3_SYSTEM,
      user: call3User(
        args.selectedStyles,
        args.userWritingSample,
        args.sampleWritingWeight,
      ),
      ...CALL3_PARAMS,
    });

    const profileText = truncateToWords(raw, 200);

    await ctx.runMutation(api.users.createStyleProfile, {
      userId: args.userId,
      profileText,
      selectedStyles: args.selectedStyles,
      userWritingSample: args.userWritingSample?.trim() || undefined,
      sampleWritingWeight: args.sampleWritingWeight,
    });

    return { profileText };
  },
});
