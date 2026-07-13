import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const POST_MODES = ["user-led", "surprise-me"] as const;

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const createPost = mutation({
  args: {
    userId: v.id("users"),
    topic: v.string(),
    userInput: v.optional(v.string()),
    mode: v.string(),
    generatedContent: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const topic = args.topic.trim();
    if (!topic) {
      throw new Error("Topic is required.");
    }

    if (!POST_MODES.includes(args.mode as (typeof POST_MODES)[number])) {
      throw new Error('Mode must be "user-led" or "surprise-me".');
    }

    const generatedContent = args.generatedContent.trim();
    if (!generatedContent) {
      throw new Error("Generated content is required.");
    }

    return await ctx.db.insert("posts", {
      userId: args.userId,
      topic,
      userInput: args.userInput?.trim() || undefined,
      mode: args.mode,
      generatedContent,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});
