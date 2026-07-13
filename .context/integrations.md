# Integrations

Last updated: 2026-07-13

## OpenRouter (only external service)

Used for all 5 LLM calls in the PRD. Calls 1-3 (onboarding) and Call 4 (post generation) are wired; 4a/5 are not yet built.

- **Client:** [convex/lib/openrouter.ts](../convex/lib/openrouter.ts) — plain `fetch` to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible). No SDK dependency, runs on the default Convex V8 runtime (no `"use node"`).
- **Prompts:** [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts) (Calls 1-3), [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts) (Call 4/4a) — mirror `../prompt-engineering.md` 1:1.
- **Model:** read from `OPENROUTER_MODEL` env var (currently `minimax/minimax-m3`), not hardcoded — swapping models is a config change, not a code change.
- **JSON calls** (style samples, and future finalize call): `chatCompletionJson()` strips ` ```json ` fences, parses, and retries the whole call once on any failure.

### Env vars live in two places — this is a recurring gotcha

- `.env.local` — read by Next.js / the Convex CLI locally. Has `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
- **Convex deployment env** — read by Convex actions at runtime (Convex does NOT read `.env.local`). Must be set separately:
  ```
  npx convex env set OPENROUTER_API_KEY <value>
  npx convex env set OPENROUTER_MODEL minimax/minimax-m3
  npx convex env list   # verify
  ```
  Already set on the current dev deployment (`impressive-wildebeest-890`) as of 2026-07-10. Any new deployment (e.g. a prod one, or a teammate's local Convex project) needs this step repeated.

### Known risk: `minimax/minimax-m3` is a reasoning model

It spends part of its token budget on hidden "reasoning" tokens before producing visible `content`. A manual test against the live API showed `content: null` with `finish_reason: "length"` when `max_tokens` was too tight (10) — the budget was fully consumed by reasoning before any content was written. A follow-up test with a realistic small prompt (~Call 1 size, `max_tokens: 300`) returned real content fine.

**Not yet verified:** Call 2 (5 style samples as JSON, `max_tokens: 700`) against the live API. Reasoning tokens + 5 full paragraphs of JSON could still truncate mid-JSON. If this happens: bump `CALL2_PARAMS.maxTokens` in `onboardingPrompts.ts` first — cheapest fix, try before anything more invasive.

**Implication for future calls (4/4a/5):** budget generously and expect to raise `maxTokens` a few times once real prompts run against this model. Don't assume a token budget is safe just because it "looks like enough words" — reasoning overhead isn't visible in the prompt/response text, only in `usage.completion_tokens` vs. what's in `content`.
