# Roadmap

## v1.0 pillars (six-month build)

1. **Flame-graph decision traces.** Every tool call, prompt turn, and memory op rendered as a zoomable flame graph. OpenTelemetry GenAI semconv on the wire.
2. **Deterministic replay.** Re-run any captured trace with one variable changed — different model, different prompt, mocked tool response — and diff the outcomes.
3. **Memory & skill inspector.** Inspect what the agent read, wrote, and forgot across turns, and see a skill-usage timeline per session.
4. **Drift detection.** Statistical comparison of current runs against a baseline window — catch regressions in tool-call patterns, token use, and success rate.

## Phases

- **Phase 1 (now)** — repo scaffold, governance, CI, design tokens. No features.
- **Phase 2** — Python SDK MVP, OTel GenAI exporter, single-file viewer rendering real traces. Ship v0.1.0.
- **Phase 3** — dashboard with persistent storage (SQLite via SQLModel), FastAPI backend.
- **Phase 4** — deterministic replay engine.
- **Phase 5** — memory/skill inspector + Textual TUI.
- **Phase 6** — drift detection, v1.0.

## v1.1 ideas (not committed)

- Trace-level cost attribution across provider/model/tenant
- Collaborative trace annotations
- CI integration: fail a build when drift exceeds a threshold

## v2 ideas (not committed)

- Multi-agent session stitching
- Guardrail violation replay

## Phase 1 follow-ups

- [x] Discord invite URL: replace server ID in README.md badge URL and the link target once the server is created. Also replace the `<!-- TODO: Discord invite URL -->` placeholder in `.github/ISSUE_TEMPLATE/config.yml`.
- [ ] Replace `[INSERT CONTACT METHOD]` in `CODE_OF_CONDUCT.md` with a real reporting address.
- [ ] Record hero GIF for README (`demo.gif`, 1200x675, <5MB). Spec in `docs/assets/README.md`.
- [ ] Known tool-harness issue: `spawn /bin/sh ENOENT` sometimes emitted by a stop-hook during scaffolding. Non-blocking; log here if it recurs.
- [ ] Migrate GitHub Actions off Node 20 before June 2026 deprecation (actions/checkout, pnpm/action-setup, actions/setup-node, actions/setup-python).

## Phase 2 blockers

- [ ] **PyPI trusted publishing setup (one-time, manual).** Before our first tagged release in Phase 2, maintainer must configure trusted publishing at https://pypi.org/manage/account/publishing/ linking `tracebloom/tracebloom` repo + `release.yml` workflow + environment name. Without this, the first `release.yml` run will fail authentication. 5-minute web UI task.
