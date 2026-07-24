import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateTopics } from "./lib/onboarding";
import {
  requireAccountId,
  requireProfileOwnedByAccount,
} from "./lib/ownership";

export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    const accountId = await requireAccountId(ctx);
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", accountId))
      .collect();
    const sorted = profiles.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      sorted.map(async (profile) => {
        const styleProfile = await ctx.db
          .query("styleProfiles")
          .withIndex("by_user", (q) => q.eq("userId", profile._id))
          .first();

        return {
          userId: profile._id,
          name: profile.name,
          role: profile.role,
          organization: profile.organization,
          createdAt: profile.createdAt,
          hasStyleProfile: styleProfile !== null,
        };
      }),
    );
  },
});

export const getProfile = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    try {
      return await requireProfileOwnedByAccount(ctx, args.userId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Not authorized to access this profile."
      ) {
        throw error;
      }
      return null;
    }
  },
});

export const getStyleProfile = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);
    return await ctx.db
      .query("styleProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getBackgroundInput = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);
    const inputs = await ctx.db
      .query("backgroundInputs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (inputs.length === 0) {
      return null;
    }

    return inputs.sort((a, b) => b.createdAt - a.createdAt)[0];
  },
});

export const createProfile = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    organization: v.string(),
  },
  handler: async (ctx, args) => {
    const accountId = await requireAccountId(ctx);
    const name = args.name.trim();
    const role = args.role.trim();
    const organization = args.organization.trim();

    if (!name || !role || !organization) {
      throw new Error("Name, role, and organization are required.");
    }

    return await ctx.db.insert("profiles", {
      ownerId: accountId,
      name,
      role,
      organization,
      professionalBackground: "",
      topics: [],
      createdAt: Date.now(),
    });
  },
});

export const saveBackgroundInput = mutation({
  args: {
    userId: v.id("profiles"),
    linkedinPaste: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);

    const linkedinPaste = args.linkedinPaste.trim();
    if (linkedinPaste.length < 50) {
      throw new Error("LinkedIn paste must be at least 50 characters.");
    }

    return await ctx.db.insert("backgroundInputs", {
      userId: args.userId,
      linkedinPaste,
      createdAt: Date.now(),
    });
  },
});

export const updateProfessionalBackground = mutation({
  args: {
    userId: v.id("profiles"),
    professionalBackground: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);

    await ctx.db.patch(args.userId, {
      professionalBackground: args.professionalBackground.trim(),
    });
  },
});

export const updateTopics = mutation({
  args: {
    userId: v.id("profiles"),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);
    const topics = validateTopics(args.topics);

    await ctx.db.patch(args.userId, { topics });
  },
});

export const createStyleProfile = mutation({
  args: {
    userId: v.id("profiles"),
    profileText: v.string(),
    selectedStyles: v.array(v.string()),
    userWritingSample: v.optional(v.string()),
    sampleWritingWeight: v.number(),
  },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);

    const existing = await ctx.db
      .query("styleProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("Style profile already exists for this user.");
    }

    return await ctx.db.insert("styleProfiles", {
      userId: args.userId,
      profileText: args.profileText.trim(),
      userWritingSample: args.userWritingSample?.trim() || undefined,
      selectedStyles: args.selectedStyles,
      sampleWritingWeight: args.sampleWritingWeight,
      updatedAt: Date.now(),
    });
  },
});

export const updateStyleProfile = mutation({
  args: {
    userId: v.id("profiles"),
    profileText: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProfileOwnedByAccount(ctx, args.userId);

    const profile = await ctx.db
      .query("styleProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Style profile not found.");
    }

    await ctx.db.patch(profile._id, {
      profileText: args.profileText.trim(),
      updatedAt: Date.now(),
    });
  },
});
