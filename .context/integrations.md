# Integrations

Last updated: 2026-07-17

## OpenRouter (only external service)

Used for all 5 LLM calls in the PRD. **All calls wired** (Calls 1–5). Calls 1–4a verified end-to-end 2026-07-17; Call 5 ships with Build Group 3 (needs manual E2E verify).

- **Client:** [convex/lib/openrouter.ts](../convex/lib/openrouter.ts) — plain `fetch` to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible). No SDK dependency, runs on the default Convex V8 runtime (no `"use node"`).
- **Prompts:** [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts) (Calls 1-3), [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts) (Calls 4/4a/5) — mirror `../prompt-engineering.md` 1:1.
- **Model:** read from `OPENROUTER_MODEL` env var (currently `minimax/minimax-m3`), not hardcoded — swapping models is a config change, not a code change.
- **JSON calls** (Calls 2 and 5): `chatCompletionJson()` strips ` ```json ` fences, parses, and retries the whole call once on any failure.

### Env vars live in two places — this is a recurring gotcha

- `.env.local` — read by Next.js / the Convex CLI locally. Has `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
- **Convex deployment env** — read by Convex actions at runtime (Convex does NOT read `.env.local`). Must be set separately:
  ```
  npx convex env set OPENROUTER_API_KEY <value>
  npx convex env set OPENROUTER_MODEL minimax/minimax-m3
  npx convex env list   # verify
  ```
  Already set on the current dev deployment (`impressive-wildebeest-890`) as of 2026-07-10. Any new deployment (e.g. a prod one, or a teammate's local Convex project) needs this step repeated.

### `minimax/minimax-m3` reasoning tokens

Token budgets were raised and `reasoning.effort: "none"` was set. E2E testing (2026-07-17) confirmed Calls 1–4a work without truncation. Call 5 uses `maxTokens: 400` with JSON output.

**Output quality:** functionally acceptable; prompt/model iteration is the next phase now that the learning loop is live.

### Convex deploy on Windows

If `npx convex dev` fails with TLS certificate errors, set `$env:NODE_OPTIONS = "--use-system-ca"` before running (see `scripts/smoke-group1.ps1`).
