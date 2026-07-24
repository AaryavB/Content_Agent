# Auth — Cursor Prompt

## Context

The product is mostly done — onboarding, generation, regenerate, finalize, and the post repository are all shipped (Build Groups 1-3). The one thing missing before this can be a real launched app: **anyone who opens the site can currently see and open every profile in the database.** There's no login. The "profile picker" home screen just lists every `users` row and lets you click into any of them.

## Why this auth model specifically

This app wasn't built as "one account = one founder." It was built for **ghostwriters managing multiple founder profiles** — Aaryav (or any ghostwriter) creates and runs several founder profiles through the same tool. A founder can *optionally* also sign up themselves and manage just their own profile.

So the ownership model is: **one account owns 1 or more profiles.** Not 1-to-1. A ghostwriter account owns many, a self-serve founder account owns one. Same underlying pattern either way — no separate "ghostwriter mode" vs "founder mode" needed.

Given that, the fix isn't "replace the profile picker" — the picker is the *right* UI for this model. The fix is:
1. Add real login (email + password — no SSO, no magic links, nothing fancy)
2. Scope the picker to only show profiles the logged-in account owns, instead of every profile in the database
3. Make sure every place the app reads or writes a profile's data checks that the logged-in account actually owns that profile — not just at the picker screen, but on every Convex function underneath. Otherwise someone could open another account's profile by reusing a profile ID directly.

## How to use this

Paste the prompt below into a **fresh Cursor chat**, as its own self-contained session — same pattern as the earlier build groups. Don't run it alongside other feature work. When Cursor finishes, review the file list it gives you and actually test: sign up two different accounts, create a profile under each, and confirm neither can see or open the other's profile before treating this as done.

---

## The Prompt

```
I need to add authentication to this Next.js + Convex app. Read @PRD.md and 
@functional-requirements.md first for product context, then follow these 
constraints exactly. Do not deviate from them or add anything beyond what's 
listed here.

PRODUCT CONTEXT (read this before making design decisions)
This app was originally built for ghostwriters to manage founder profiles 
on their behalf — a ghostwriter creates and runs multiple founder profiles 
through the same tool. Optionally, a founder can also sign up directly and 
manage their own profile themselves.

This means the account layer and the "profile" layer are NOT the same 
thing, and NOT 1:1:
- One authenticated account (a ghostwriter) can own MANY founder profiles 
  (many `users` rows).
- One authenticated account (a founder managing themselves) owns exactly 
  ONE founder profile.
Both are the same underlying pattern — an account can own 1 or more 
profiles. Do not build two different code paths for "ghostwriter mode" vs 
"founder mode." It's the same ownership model either way.

HARD CONSTRAINTS — do not deviate
1. Use Convex Auth (the official @convex-dev/auth package) with EMAIL + 
   PASSWORD only. Do not install Clerk, NextAuth, Auth.js, Supabase Auth, 
   or any other auth library or third-party auth service.
2. No SSO, no OAuth providers (no Google/GitHub/etc login buttons), no 
   magic links, no OTP/SMS. Email + password only.
3. No email verification flow. No "forgot password" / reset-password flow. 
   Out of scope for this pass — note as a TODO comment if you want, but 
   do not build them.
4. No roles, no permissions, no "ghostwriter" vs "founder" account types 
   in the schema or logic. An account is just an account. It owns zero or 
   more profiles. Do not add a `role` or `accountType` field anywhere.
5. No teams, no shared/collaborative access to a profile between multiple 
   accounts. Each `users` (profile) row is owned by exactly one account.
6. Do not restructure the existing `styleProfiles`, `posts`, or 
   `backgroundInputs` tables at all. Do not touch onboarding, generation, 
   regenerate, finalize, or repository logic — those flows are done and 
   working, leave their internals alone.
7. Do not add rate limiting, CAPTCHA, session-timeout config, or any 
   security hardening beyond what Convex Auth gives you by default.

SCHEMA CHANGE (the only schema change allowed)
Add an `ownerId` field to the `users` table (the founder-profile table) 
that references the authenticated account. Index it so profiles can be 
queried by owner. This is the only schema modification permitted.

WHAT TO REPLACE
- components/HomeContent.tsx currently queries `api.users.listUsers`, 
  which returns EVERY profile in the database to whoever loads the page — 
  a stranger can currently see and open anyone's profile. Fix this by 
  scoping the query to only the profiles owned by the currently 
  authenticated account (filter by `ownerId`). The picker UI itself 
  (list of profile cards, "create new profile" button) can stay largely 
  as-is — it's the right pattern for a ghostwriter managing multiple 
  profiles. It just needs to be scoped per-account instead of global.
- The current userId is stored client-side via lib/onboardingSession.ts 
  (localStorage) to track which profile is "active." Keep this for 
  tracking which profile is currently selected within a session, but it 
  must no longer be the only gate — every Convex query/mutation that reads 
  or writes a specific profile's data must also verify that profile's 
  `ownerId` matches the currently authenticated account. Do not rely on 
  "the client only shows you your own profiles" as the security boundary — 
  someone could otherwise open another account's profile by guessing/ 
  reusing a profile ID directly. Server-side ownership checks are required 
  on every profile-scoped query and mutation, not just at the picker.

WHAT TO BUILD
1. Install and configure Convex Auth for email/password in this existing 
   Next.js App Router + Convex project.
2. A /signup page (email, password, confirm password) and a /login page 
   (email, password). Simple forms, matching the existing UI components in 
   components/ui/ (Button, Input, Field, Card, etc.) — don't introduce a 
   new design system.
3. Sign-up creates ONLY the authenticated account — it does NOT auto-create 
   a `users` (profile) row. Profile creation stays exactly as it is today: 
   the "Create new profile" flow in onboarding, now stamping the new 
   profile's `ownerId` with the current account's id.
4. Protect the home/picker page, /onboarding, and /dashboard so only 
   authenticated accounts can reach them. Unauthenticated visitors get 
   redirected to /login.
5. Add ownership checks to every existing Convex query/mutation that reads 
   or writes a specific profile's data (users, styleProfiles, posts, 
   backgroundInputs, all scoped by that profile's userId) — reject if the 
   requesting account doesn't own that profile via `ownerId`.
6. A logout button/action, placed wherever makes sense in the existing 
   nav (components/AppLayout.tsx or similar — check what's already there).

WHEN DONE
List every file you created or modified, and flag anything you had to 
deviate from these constraints on and why. Do not silently expand scope — 
if something in the existing code makes one of these constraints hard to 
satisfy cleanly, stop and tell me instead of improvising a workaround.
```
