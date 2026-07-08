import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  STYLE_LABELS,
  stubProfessionalBackground,
  stubStyleProfile,
  stubStyleSample,
  validateStyleProfileInput,
} from "./lib/onboarding";

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

    const professionalBackground = stubProfessionalBackground(linkedinPaste);

    await ctx.runMutation(api.users.updateProfessionalBackground, {
      userId: args.userId,
      professionalBackground,
    });

    return { professionalBackground };
  },
});

export const generateStyleSamples = action({
  args: { topic: v.string() },
  handler: async (_ctx, args) => {
    const topic = args.topic.trim();
    if (!topic) {
      throw new Error("Topic is required.");
    }

    const samples = STYLE_LABELS.map((style) => ({
      style,
      content: stubStyleSample(topic, style),
    }));

    return { samples };
  },
});

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

    const profileText = stubStyleProfile(
      args.selectedStyles,
      args.userWritingSample,
      args.sampleWritingWeight,
    );

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
