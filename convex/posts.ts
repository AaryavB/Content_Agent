import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

const POST_MODES = ["user-led", "surprise-me"] as const;

function assertDraftPost(post: Doc<"posts"> | null): Doc<"posts"> {
  if (!post) {
    throw new Error("Post not found.");
  }

  if (post.status !== "draft") {
    throw new Error("Only draft posts can be updated.");
  }

  return post;
}

export const getPostsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return posts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

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

export const regeneratePost = mutation({
  args: {
    postId: v.id("posts"),
    generatedContent: v.string(),
    regenerateNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertDraftPost(await ctx.db.get(args.postId));

    const generatedContent = args.generatedContent.trim();
    if (!generatedContent) {
      throw new Error("Generated content is required.");
    }

    await ctx.db.patch(args.postId, {
      generatedContent,
      regenerateNote: args.regenerateNote?.trim() || undefined,
    });
  },
});

export const rejectPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    assertDraftPost(await ctx.db.get(args.postId));

    await ctx.db.patch(args.postId, { status: "rejected" });
  },
});
