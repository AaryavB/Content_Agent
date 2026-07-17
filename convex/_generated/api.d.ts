/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_onboarding from "../lib/onboarding.js";
import type * as lib_onboardingPrompts from "../lib/onboardingPrompts.js";
import type * as lib_openrouter from "../lib/openrouter.js";
import type * as lib_postPrompts from "../lib/postPrompts.js";
import type * as onboardingActions from "../onboardingActions.js";
import type * as postActions from "../postActions.js";
import type * as posts from "../posts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/onboarding": typeof lib_onboarding;
  "lib/onboardingPrompts": typeof lib_onboardingPrompts;
  "lib/openrouter": typeof lib_openrouter;
  "lib/postPrompts": typeof lib_postPrompts;
  onboardingActions: typeof onboardingActions;
  postActions: typeof postActions;
  posts: typeof posts;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
