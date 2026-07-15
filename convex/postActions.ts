import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { chatCompletion } from "./lib/openrouter";
import { CALL4_PARAMS, CALL4_SYSTEM, call4User } from "./lib/postPrompts";

export const generatePost = action({
  args: {
    userId: v.id("users"),
    topic: v.string(),
    userInput: v.optional(v.string()),
    mode: v.union(v.literal("user-led"), v.literal("surprise-me")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ postId: Id<"posts">; generatedContent: string }> => {
    const topic = args.topic.trim();
    if (!topic) {
      throw new Error("Topic is required.");
    }

    const user = await ctx.runQuery(api.users.getUser, { userId: args.userId });
    if (!user) {
      throw new Error("User not found. Complete onboarding first.");
    }

    const styleProfile = await ctx.runQuery(api.users.getStyleProfile, {
      userId: args.userId,
    });
    if (!styleProfile) {
      throw new Error("Style profile not found. Complete onboarding first.");
    }

    if (!user.professionalBackground.trim()) {
      throw new Error("Professional background is missing. Complete onboarding first.");
    }

    const generatedContent = (
      await chatCompletion({
        system: CALL4_SYSTEM,
        user: call4User({
          name: user.name,
          role: user.role,
          organization: user.organization,
          professionalBackground: user.professionalBackground,
          styleProfileText: styleProfile.profileText,
          topic,
          userInput: args.userInput,
        }),
        ...CALL4_PARAMS,
      })
    ).trim();

    if (!generatedContent) {
      throw new Error("Post generation returned empty content.");
    }

    const postId = await ctx.runMutation(api.posts.createPost, {
      userId: args.userId,
      topic,
      userInput: args.userInput,
      mode: args.mode,
      generatedContent,
    });

    return { postId, generatedContent };
  },
});

export const regeneratePostAction = action({
  args: {
    postId: v.id("posts"),
    regenerateNote: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ generatedContent: string }> => {
    const post = await ctx.runQuery(api.posts.getPost, { postId: args.postId });
    if (!post) {
      throw new Error("Post not found.");
    }

    if (post.status !== "draft") {
      throw new Error("Only draft posts can be regenerated.");
    }

    const user = await ctx.runQuery(api.users.getUser, { userId: post.userId });
    if (!user) {
      throw new Error("User not found. Complete onboarding first.");
    }

    const styleProfile = await ctx.runQuery(api.users.getStyleProfile, {
      userId: post.userId,
    });
    if (!styleProfile) {
      throw new Error("Style profile not found. Complete onboarding first.");
    }

    if (!user.professionalBackground.trim()) {
      throw new Error("Professional background is missing. Complete onboarding first.");
    }

    const generatedContent = (
      await chatCompletion({
        system: CALL4_SYSTEM,
        user: call4User({
          name: user.name,
          role: user.role,
          organization: user.organization,
          professionalBackground: user.professionalBackground,
          styleProfileText: styleProfile.profileText,
          topic: post.topic,
          userInput: post.userInput,
          regenerateNote: args.regenerateNote,
        }),
        ...CALL4_PARAMS,
      })
    ).trim();

    if (!generatedContent) {
      throw new Error("Post regeneration returned empty content.");
    }

    await ctx.runMutation(api.posts.regeneratePost, {
      postId: args.postId,
      generatedContent,
      regenerateNote: args.regenerateNote,
    });

    return { generatedContent };
  },
});
