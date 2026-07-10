# PRD Index

Last updated: 2026-07-10

**Canonical specs live at repo root — do not duplicate them here:**
- [`../PRD.md`](../PRD.md) — problem statement, 3-step product flow (Onboard → Generate → Polish/Publish), MVP scope vs post-MVP, data model, LLM call inventory (5 calls), key constraints, user stories.
- [`../functional-requirements.md`](../functional-requirements.md) — implementation-level spec: tech stack, Convex schema/functions, screen specs, data flows, error handling. Split into 3 build groups.
- [`../prompt-engineering.md`](../prompt-engineering.md) — actual prompt text for all 5 LLM calls, output format (JSON vs plain text) per call, temperature/token params. Calls 1-3 (onboarding) are wired into code; calls 4/4a/5 are drafted text only, not yet wired (no code to wire them into — Build Groups 2/3 don't exist).

## Build groups (from functional-requirements.md)

| Group | Scope | Status |
|---|---|---|
| 1. Foundation + Onboarding | Convex schema, onboarding flow, LLM calls 1-3 | Built, LLM calls wired to real OpenRouter — pending live end-to-end test, see [progress.md](progress.md) |
| 2. Post Generation | Dashboard, generate/regenerate/reject, LLM calls 4 & 4a | Not started |
| 3. Polish, Publish + Repository | Inline editor, finalize, copy, repository, LLM call 5 | Not started |

## LLM provider — decided 2026-07-10

**OpenRouter**, initial model **`minimax/minimax-m3`** for all 5 LLM calls. Model is expected to change per-task or overall after quality testing, so it's stored as an env var (`OPENROUTER_MODEL`), not hardcoded. See [integrations.md](integrations.md) for how the client works and a known risk with this model. See [db-schema.md](db-schema.md) / todo.md for wiring status.

Prompt text for calls 1-3 is wired — see `../prompt-engineering.md` and [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts).

For everything else (deadline, positioning, mentoring narrative), see the sibling `aaryav-project/context-documents/` folder — that's mentee/session context, not product spec.
