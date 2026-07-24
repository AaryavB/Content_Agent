# Integrations

Last updated: 2026-07-24

## Convex Auth (email + password)

- **Package:** `@convex-dev/auth` with Password provider only — no OAuth, magic links, email verification, or password reset in this pass.
- **Config:** [convex/auth.ts](../convex/auth.ts), [convex/auth.config.ts](../convex/auth.config.ts), [convex/http.ts](../convex/http.ts).
- **Provider:** `ConvexAuthProvider` in [components/ConvexClientProvider.tsx](../components/ConvexClientProvider.tsx).
- **Routes:** `/login`, `/signup` (public). `/`, `/onboarding`, `/dashboard` require auth via [components/RequireAuth.tsx](../components/RequireAuth.tsx).
- **Ownership:** founder profiles in `profiles` table with `ownerId` → auth `users`. All profile/post Convex functions verify ownership in [convex/lib/ownership.ts](../convex/lib/ownership.ts).

### Convex Auth env vars (required on deployment)

Set on the Convex deployment (not Netlify):

```
JWT_PRIVATE_KEY="<PKCS8 private key, newlines as spaces>"
JWKS='{"keys":[...]}'
```

Generate keys per [Convex Auth manual setup](https://labs.convex.dev/auth/setup/manual) (`node generateKeys.mjs` using `jose`). Without these, sign-in/sign-up will fail at runtime.

Email/password only. No `SITE_URL` needed unless OAuth is added later.

## OpenRouter (only external LLM service)

Used for all 5 LLM calls in the PRD. **All calls wired** (Calls 1–5). Calls 1–4a verified end-to-end 2026-07-17; Call 5 built with Group 3 (needs manual E2E verify).

- **Client:** [convex/lib/openrouter.ts](../convex/lib/openrouter.ts) — plain `fetch` to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible). No SDK dependency, runs on the default Convex V8 runtime (no `"use node"`).
- **Prompts:** [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts) (Calls 1-3), [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts) (Calls 4/4a/5) — mirror `../prompt-engineering.md` 1:1.
- **Model:** read from `OPENROUTER_MODEL` env var (currently `minimax/minimax-m3`), not hardcoded — swapping models is a config change, not a code change.
- **JSON calls** (Calls 2 and 5): `chatCompletionJson()` strips ` ```json ` fences, parses, and retries the whole call once on any failure.

### Env vars live in three places — recurring gotcha

| Where | Vars | Read by |
|---|---|---|
| `.env.local` | `CONVEX_URL`, `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Next.js locally, Convex CLI |
| **Convex deployment env** | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `JWT_PRIVATE_KEY`, `JWKS` | Convex actions + auth at runtime |
| **Netlify env** | `NEXT_PUBLIC_CONVEX_URL` | Next.js production build + browser |

Convex actions do **not** read `.env.local` or Netlify env. Set Convex vars separately:
```
npx convex env set OPENROUTER_API_KEY <value>
npx convex env set OPENROUTER_MODEL minimax/minimax-m3
npx convex env list   # verify
```

Netlify (Site settings → Environment variables):
```
NEXT_PUBLIC_CONVEX_URL=https://impressive-wildebeest-890.convex.cloud
```

Dev deployment: `impressive-wildebeest-890` on team `aaryavgb`, project `content-agent`. Any new Convex deployment or teammate clone needs Convex env vars repeated.

### `minimax/minimax-m3` reasoning tokens

Token budgets were raised and `reasoning.effort: "none"` was set. E2E testing (2026-07-17) confirmed Calls 1–4a work without truncation. Call 5 uses `maxTokens: 400` with JSON output.

**Output quality:** functionally acceptable; prompt/model iteration is the next phase now that the learning loop is live.

## Netlify (frontend hosting)

- **Config:** [netlify.toml](../netlify.toml) — `npm run build`, publish `.next`, Node 20.
- **Branch:** `master` (auto-deploy).
- **Build requirement:** `convex/_generated/` must be committed. Netlify does not run `convex dev`; without generated bindings, build fails with `Can't resolve '@/convex/_generated/api'`. After changing `convex/` functions, run `npx convex codegen` locally and commit updated `convex/_generated/`.
- **Backend:** Convex cloud (not Netlify). Frontend is static/SSR Next.js only; all data + LLM calls go through Convex client → Convex deployment.

## Production deployment (runbook)

| Deployment | Name | URL |
|---|---|---|
| Dev | `impressive-wildebeest-890` | `https://impressive-wildebeest-890.convex.cloud` |
| **Prod** | `marvelous-fly-60` | `https://marvelous-fly-60.convex.cloud` |

**Status (2026-07-24):** prod deployment created; `OPENROUTER_API_KEY` and
`OPENROUTER_MODEL` set on it. Still outstanding: steps 1–4 below.

> Netlify's `NEXT_PUBLIC_CONVEX_URL` still points at the **dev** deployment, so the
> live site and local development share one database — test data written locally
> shows up on the live site. Step 3 fixes that.

**Owner rights required.** Deploying to prod and creating deployments are
owner-only; other team members get `You do not have permission to perform this
operation (deployment:deploy)`. Team members *can* read prod env vars.

Run in this order — repointing Netlify before prod has the schema breaks the live site.

1. **Set the JWT keypair on prod.** Generate a **fresh** pair — never copy the dev
   values. `JWKS` and `JWT_PRIVATE_KEY` are two halves of one key and must come from
   the same run:
   ```
   npm run generate:keys
   npx convex env set JWT_PRIVATE_KEY --prod -- "<value>"
   npx convex env set JWKS --prod -- '<value>'
   npx convex env list --prod           # expect all four
   ```
   The OpenRouter key/model are safe to copy from dev; the JWT pair is not — a shared
   signing key means a dev-issued login token is accepted by production.

2. **Push schema + functions to prod** (owner only):
   ```
   npx convex deploy          # Windows: npm run convex:deploy
   ```

3. **Repoint Netlify** → Site settings → Environment variables:
   `NEXT_PUBLIC_CONVEX_URL` = `https://marvelous-fly-60.convex.cloud`

4. **Merge `staging` → `master`.** Netlify auto-deploys from `master`, which still
   predates auth. Nothing ships until this merge happens.

5. **Smoke-test prod:** signup → login → onboarding → generate → finalize.

### Optional: let Netlify deploy Convex itself

Only needed if the Netlify build should run `convex deploy` (it currently does not —
it builds Next.js against the committed `convex/_generated/`). Requires a
`CONVEX_DEPLOY_KEY` from the Convex dashboard set as a Netlify env var, since CI
cannot do an interactive browser login. A local `npx convex deploy` needs no such key.

### Convex deploy on Windows

**PowerShell `npx` blocked:** If `npx convex ...` fails with "running scripts is disabled on this system", use either:
- `npx.cmd convex login` (note the `.cmd`)
- `npm run convex:login` / `npm run convex:dev` (npm scripts call `convex` directly and avoid `npx.ps1`)

Permanent fix (optional, in PowerShell as your user): `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**TLS certificate errors:** set `$env:NODE_OPTIONS = "--use-system-ca"` before running (see `scripts/smoke-group1.ps1`).
