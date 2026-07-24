import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

function normalizeEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new Error("Email is required.");
  }
  return email.trim().toLowerCase();
}

// TODO: email verification and password reset are out of scope for this pass.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return { email: normalizeEmail(params.email) };
      },
    }),
  ],
});
