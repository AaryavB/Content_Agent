import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateTopics } from "./lib/onboarding";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const sorted = users.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      sorted.map(async (user) => {
        const styleProfile = await ctx.db
          .query("styleProfiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          userId: user._id,
          name: user.name,
          role: user.role,
          organization: user.organization,
          createdAt: user.createdAt,
          hasStyleProfile: styleProfile !== null,
        };
      }),
    );
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getStyleProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("styleProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getBackgroundInput = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
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

export const createUser = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    organization: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const role = args.role.trim();
    const organization = args.organization.trim();

    if (!name || !role || !organization) {
      throw new Error("Name, role, and organization are required.");
    }

    return await ctx.db.insert("users", {
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
    userId: v.id("users"),
    linkedinPaste: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

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
    userId: v.id("users"),
    professionalBackground: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    await ctx.db.patch(args.userId, {
      professionalBackground: args.professionalBackground.trim(),
    });
  },
});

export const updateTopics = mutation({
  args: {
    userId: v.id("users"),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const topics = validateTopics(args.topics);

    await ctx.db.patch(args.userId, { topics });
  },
});

export const createStyleProfile = mutation({
  args: {
    userId: v.id("users"),
    profileText: v.string(),
    selectedStyles: v.array(v.string()),
    userWritingSample: v.optional(v.string()),
    sampleWritingWeight: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

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
    userId: v.id("users"),
    profileText: v.string(),
  },
  handler: async (ctx, args) => {
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
