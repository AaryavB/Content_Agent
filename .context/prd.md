# PRD Index

Last updated: 2026-07-10

**Canonical specs live at repo root — do not duplicate them here:**
- [`../PRD.md`](../PRD.md) — problem statement, 3-step product flow (Onboard → Generate → Polish/Publish), MVP scope vs post-MVP, data model, LLM call inventory (5 calls), key constraints, user stories.
- [`../functional-requirements.md`](../functional-requirements.md) — implementation-level spec: tech stack, Convex schema/functions, screen specs, data flows, error handling. Split into 3 build groups.

## Build groups (from functional-requirements.md)

| Group | Scope | Status |
|---|---|---|
| 1. Foundation + Onboarding | Convex schema, onboarding flow, LLM calls 1-3 | Built, LLM calls stubbed — see [progress.md](progress.md) |
| 2. Post Generation | Dashboard, generate/regenerate/reject, LLM calls 4 & 4a | Not started |
| 3. Polish, Publish + Repository | Inline editor, finalize, copy, repository, LLM call 5 | Not started |

## LLM provider — decided 2026-07-10

**OpenRouter**, initial model **`minimax/minimax-m3`** for all 5 LLM calls. Model is expected to change per-task or overall after quality testing, so it's stored as an env var (`OPENROUTER_MODEL`), not hardcoded — see [db-schema.md](db-schema.md) / todo.md for wiring status.

Still unresolved: actual prompt text for calls 1-5, token budgets, output parsing (structured vs free text) — the rest of the "prompt engineering session" noted at the bottom of `functional-requirements.md`.

For everything else (deadline, positioning, mentoring narrative), see the sibling `aaryav-project/context-documents/` folder — that's mentee/session context, not product spec.
