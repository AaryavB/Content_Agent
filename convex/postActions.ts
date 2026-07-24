import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  requirePostOwnedByAccountAction,
  requireProfileOwnedByAccountAction,
} from "./lib/ownership";
import { chatCompletion, chatCompletionJson } from "./lib/openrouter";
import {
  CALL4_PARAMS,
  CALL4_SYSTEM,
  CALL5_PARAMS,
  CALL5_SYSTEM,
  Call4UserParams,
  call4User,
  call5User,
  parseCall5Result,
} from "./lib/postPrompts";
import { truncateToWords } from "./lib/onboarding";
import {
  describeViolations,
  lintSlop,
  scrubHardTokens,
} from "./lib/slopFilter";

const CALL4_REPAIR_PARAMS = {
  ...CALL4_PARAMS,
  temperature: 0.65,
} as const;

async function generateCleanDraft(
  call4Params: Call4UserParams,
): Promise<string> {
  let draft = (
    await chatCompletion({
      system: CALL4_SYSTEM,
      user: call4User(call4Params),
      ...CALL4_PARAMS,
    })
  ).trim();

  let violations = lintSlop(draft);
  if (violations.length > 0) {
    draft = (
      await chatCompletion({
        system: CALL4_SYSTEM,
        user: call4User({
          ...call4Params,
          repairNote: describeViolations(violations),
        }),
        ...CALL4_REPAIR_PARAMS,
      })
    ).trim();
    violations = lintSlop(draft);
  }

  if (violations.length > 0) {
    console.log(
      "Anti-slop: surviving violations after repair",
      JSON.stringify(violations),
    );
    draft = scrubHardTokens(draft);
  }

  return draft;
}

export const generatePost = action({
  args: {
    userId: v.id("profiles"),
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

    const user = await requireProfileOwnedByAccountAction(ctx, args.userId);

    const styleProfile = await ctx.runQuery(api.profiles.getStyleProfile, {
      userId: args.userId,
    });
    if (!styleProfile) {
      throw new Error("Style profile not found. Complete onboarding first.");
    }

    if (!user.professionalBackground.trim()) {
      throw new Error("Professional background is missing. Complete onboarding first.");
    }

    const generatedContent = await generateCleanDraft({
      name: user.name,
      role: user.role,
      organization: user.organization,
      professionalBackground: user.professionalBackground,
      styleProfileText: styleProfile.profileText,
      topic,
      userInput: args.userInput,
    });

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
    const post = await requirePostOwnedByAccountAction(ctx, args.postId);

    if (post.status !== "draft") {
      throw new Error("Only draft posts can be regenerated.");
    }

    const user = await requireProfileOwnedByAccountAction(ctx, post.userId);

    const styleProfile = await ctx.runQuery(api.profiles.getStyleProfile, {
      userId: post.userId,
    });
    if (!styleProfile) {
      throw new Error("Style profile not found. Complete onboarding first.");
    }

    if (!user.professionalBackground.trim()) {
      throw new Error("Professional background is missing. Complete onboarding first.");
    }

    const generatedContent = await generateCleanDraft({
      name: user.name,
      role: user.role,
      organization: user.organization,
      professionalBackground: user.professionalBackground,
      styleProfileText: styleProfile.profileText,
      topic: post.topic,
      userInput: post.userInput,
      regenerateNote: args.regenerateNote,
    });

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

export const finalizePostAction = action({
  args: {
    postId: v.id("posts"),
    finalContent: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    updatedProfileText: string | null;
    profileUpdateFailed: boolean;
  }> => {
    const post = await requirePostOwnedByAccountAction(ctx, args.postId);

    if (post.status !== "draft") {
      throw new Error("Only draft posts can be finalized.");
    }

    const finalContent = args.finalContent.trim();
    if (!finalContent) {
      throw new Error("Final content is required.");
    }

    if (finalContent === post.generatedContent) {
      await ctx.runMutation(api.posts.finalizePost, {
        postId: args.postId,
        finalContent,
      });

      return { updatedProfileText: null, profileUpdateFailed: false };
    }

    const styleProfile = await ctx.runQuery(api.profiles.getStyleProfile, {
      userId: post.userId,
    });
    if (!styleProfile) {
      throw new Error("Style profile not found. Complete onboarding first.");
    }

    const call5Result = await chatCompletionJson(
      {
        system: CALL5_SYSTEM,
        user: call5User({
          currentProfileText: styleProfile.profileText,
          generatedContent: post.generatedContent,
          finalContent,
        }),
        ...CALL5_PARAMS,
        responseFormatJson: true,
      },
      parseCall5Result,
    );

    const updatedProfileText = truncateToWords(
      call5Result.updatedProfileText,
      200,
    );

    let profileUpdateFailed = false;

    try {
      await ctx.runMutation(api.profiles.updateStyleProfile, {
        userId: post.userId,
        profileText: updatedProfileText,
      });
    } catch {
      profileUpdateFailed = true;
    }

    await ctx.runMutation(api.posts.finalizePost, {
      postId: args.postId,
      finalContent,
      editsDiff: call5Result.editsDiff,
    });

    return {
      updatedProfileText: profileUpdateFailed ? null : updatedProfileText,
      profileUpdateFailed,
    };
  },
});
