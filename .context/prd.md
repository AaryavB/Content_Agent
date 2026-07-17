# PRD Index

Last updated: 2026-07-17

**Canonical specs live at repo root — do not duplicate them here:**
- [`../PRD.md`](../PRD.md) — problem statement, 3-step product flow (Onboard → Generate → Polish/Publish), MVP scope vs post-MVP, data model, LLM call inventory (5 calls), key constraints, user stories.
- [`../functional-requirements.md`](../functional-requirements.md) — implementation-level spec: tech stack, Convex schema/functions, screen specs, data flows, error handling. Split into 3 build groups.
- [`../prompt-engineering.md`](../prompt-engineering.md) — prompt text for all 5 LLM calls, output format (JSON vs plain text) per call, temperature/token params. All calls wired in code.

## Build groups (from functional-requirements.md)

| Group | Scope | Status |
|---|---|---|
| 1. Foundation + Onboarding | Convex schema, onboarding flow, LLM calls 1-3 | **Built + verified** — see [progress.md](progress.md) |
| 2. Post Generation | Dashboard, generate/regenerate/reject, LLM calls 4 & 4a | **Built + verified** |
| 3. Polish, Publish + Repository | Inline editor, finalize, copy, repository, LLM call 5 | **Built** — pending production E2E |

**MVP status:** Feature-complete. Next phase is quality tuning and real founder usage (see [todo.md](todo.md)).

## LLM provider — decided 2026-07-10

**OpenRouter**, initial model **`minimax/minimax-m3`** for all 5 LLM calls. Model stored as env var (`OPENROUTER_MODEL`), not hardcoded. See [integrations.md](integrations.md) for env var locations (local, Convex deployment, Netlify).

Prompt text: `../prompt-engineering.md`. Code: [convex/lib/onboardingPrompts.ts](../convex/lib/onboardingPrompts.ts) (Calls 1–3), [convex/lib/postPrompts.ts](../convex/lib/postPrompts.ts) (Calls 4/4a/5).

## Hosting

- **Frontend:** Netlify (`master` branch) — see [integrations.md](integrations.md)
- **Backend + DB + LLM:** Convex cloud deployment `impressive-wildebeest-890`

For mentoring/session narrative (deadline, positioning), see sibling `aaryav-project/context-documents/` — that's mentee context, not product spec.
