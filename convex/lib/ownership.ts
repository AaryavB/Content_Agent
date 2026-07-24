import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

export async function requireAccountId(ctx: DbCtx | ActionCtx): Promise<Id<"users">> {
  const accountId = await getAuthUserId(ctx);
  if (!accountId) {
    throw new Error("Not authenticated.");
  }
  return accountId;
}

export async function requireProfileOwnedByAccount(
  ctx: DbCtx,
  profileId: Id<"profiles">,
) {
  const accountId = await requireAccountId(ctx);
  const profile = await ctx.db.get(profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }
  if (profile.ownerId !== accountId) {
    throw new Error("Not authorized to access this profile.");
  }
  return profile;
}

export async function requirePostOwnedByAccount(
  ctx: DbCtx,
  postId: Id<"posts">,
) {
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new Error("Post not found.");
  }
  await requireProfileOwnedByAccount(ctx, post.userId);
  return post;
}

export async function requireProfileOwnedByAccountAction(
  ctx: ActionCtx,
  profileId: Id<"profiles">,
) {
  await requireAccountId(ctx);
  const profile = await ctx.runQuery(api.profiles.getProfile, {
    userId: profileId,
  });
  if (!profile) {
    throw new Error("Profile not found.");
  }
  return profile;
}

export async function requirePostOwnedByAccountAction(
  ctx: ActionCtx,
  postId: Id<"posts">,
) {
  await requireAccountId(ctx);
  const post = await ctx.runQuery(api.posts.getPost, { postId });
  if (!post) {
    throw new Error("Post not found.");
  }
  return post;
}
