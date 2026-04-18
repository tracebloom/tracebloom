# AGENTS.md

Instructions for AI agents (Claude, Codex, Cursor, etc.) working in this repository. Human contributors should also read this — the ground rules are the same.

## Mission

tracebloom is a debugger for AI agents. The one-liner is:

> See every decision your agent makes. Replay any run with one variable changed. Catch drift before your users do.

v1.0 has four pillars: flame-graph decision traces, deterministic replay, memory/skill inspector, drift detection. Three surfaces: Python SDK+CLI, Textual TUI (Phase 5+), web dashboard with exportable single-file HTML viewer. OpenTelemetry GenAI semantic conventions are the wire format.

## Locked scope (do not relitigate)

These decisions are final for v1.0. Do not propose alternatives. If you believe one must change, open an issue describing the problem — do not silently deviate.

- **Monorepo:** exactly two packages under `packages/` — `tracebloom/` (Python) and `dashboard/` (Vite+React). No third package. If you think you need one, ask.
- **Dashboard builds:** one codebase, two Vite configs — `vite.config.ts` → `dist/dashboard/` and `vite.config.viewer.ts` → `dist/viewer/viewer.html` (single-file via `vite-plugin-singlefile`, under 200KB).
- **UI framework:** Vite + React. React Router for routing. No Next.js, Preact, Svelte, Solid, Vue.
- **CSS:** Tailwind v4 + CSS custom properties in `src/tokens.css`, mirrored in `src/lib/tokens.ts`. No CSS-in-JS.
- **Python deps:** click, opentelemetry-api, opentelemetry-sdk, opentelemetry-semantic-conventions, httpx, pydantic>=2, sqlmodel, fastapi, textual. Declared in pyproject.toml — not all imported yet.
- **Node version:** LTS (20+). Root `package.json` has `"engines": { "node": ">=20" }`.
- **CI:** full matrix (ubuntu+macos × py3.10–3.13) on main; PRs run py3.10+3.12 on ubuntu only.
- **Release:** PyPI trusted publishing via OIDC. No API token secret.
- **Viewer build is minimal by design.** The viewer (vite.config.viewer.ts) does NOT use Tailwind, React Router, or any routing. It imports tokens.css only and uses inline styles. This is a size-budget decision (200KB single-file target). When adding to the viewer, account for this — every new dependency eats the budget.

## What NOT to do

- **No** Redis, Kafka, Kubernetes, microservices, gRPC.
- **No** ORM other than SQLModel.
- **No** UI framework other than Vite + React.
- **No** Textual alternatives for the TUI (Rich, Urwid, etc.) — Textual is the pick.
- **No** PyPI token secrets in CI. Trusted publishing only.
- **No** invented metrics, fake testimonials, "trusted by X developers" lines.
- **No** placeholder Lorem Ipsum. Every stub has one true sentence.

## Coding standards

- Python: ruff + mypy strict. Use `click.echo`, never `print`. Type every public signature.
- TypeScript: tsc strict. Prefer named exports. No default exports except Vite entrypoints.
- CSS: token-driven. Reach for a value in `tokens.css` before writing a literal color or radius.
- Tests required for every bug fix and every feature. 80% coverage floor once we have real code.

## Documentation format conventions

- All markdown tables use ASCII pipe-and-dash format: `|` (U+007C) and `-` (U+002D). Never Unicode box-drawing characters (`┌┬┐├┼┤└┴┘│─`). Even though box-drawing renders attractively in some terminals, it renders as literal characters on GitHub and breaks in most markdown tooling.
- All code blocks are triple-backtick fenced with a language tag (```json, ```python, ```bash, etc.). Never indented blocks.
- When a reviewer critiques a format issue, Claude Code MUST verify the critique against the actual artifact characters before fixing. If the critique doesn't match the artifact (e.g., reviewer claims box-drawing, artifact has ASCII pipes), push back with evidence rather than silently "fixing" a non-issue. Performing a fix that isn't needed teaches both sides worse habits.

## Commit convention

Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`, `ci:`. One logical change per commit. PR titles mirror commit subjects.

## How to ask a good question when stuck

1. State what you tried (last three attempts).
2. State what you expected vs what happened, including exact error text.
3. Cite the line number(s) involved.
4. Name the constraint that is blocking you (performance, API shape, locked scope).
5. Propose two options and say which you prefer and why.
