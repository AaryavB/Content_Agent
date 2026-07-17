# Integrations

Last updated: 2026-07-17

## OpenRouter (only external service)

Used for all 5 LLM calls in the PRD. **All calls wired** (Calls 1–5). Calls 1–4a verified end-to-end 2026-07-17; Call 5 built with Group 3 (needs manual E2E verify).

- **Client:** [convex/lib/openrouter.ts](../convex/lib/openrouter.ts) — plain `fetch` to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible). No SDK dependency, runs on the default Convex V8 runtime (no `"use node"`).
- **Prompts:** [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts) (Calls 1-3), [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts) (Calls 4/4a/5) — mirror `../prompt-engineering.md` 1:1.
- **Model:** read from `OPENROUTER_MODEL` env var (currently `minimax/minimax-m3`), not hardcoded — swapping models is a config change, not a code change.
- **JSON calls** (Calls 2 and 5): `chatCompletionJson()` strips ` ```json ` fences, parses, and retries the whole call once on any failure.

### Env vars live in three places — recurring gotcha

| Where | Vars | Read by |
|---|---|---|
| `.env.local` | `CONVEX_URL`, `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Next.js locally, Convex CLI |
| **Convex deployment env** | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Convex actions at runtime |
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

### Convex deploy on Windows

If `npx convex dev` fails with TLS certificate errors, set `$env:NODE_OPTIONS = "--use-system-ca"` before running (see `scripts/smoke-group1.ps1`).
