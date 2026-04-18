# tracebloom (Python SDK + CLI)

The Python half of tracebloom. Provides the `tracebloom` package (SDK) and the `tracebloom` command-line entry point.

## Install

```bash
pip install tracebloom
```

## Usage (Phase 2+)

```python
import tracebloom
tracebloom.init(project="my-agent")

# your agent code ...

tracebloom.flush()
```

Today this package ships a CLI scaffold (`tracebloom --help`, `tracebloom demo`, `tracebloom doctor`) and nothing else. Feature work lands in Phase 2.

## Declared dependencies

The following runtime dependencies are declared in `pyproject.toml` but not yet imported anywhere in code. They are pinned now to reserve the surface area we will build against in Phase 2, and to keep contributor environments consistent:

- `click` — CLI (in use)
- `opentelemetry-api`, `opentelemetry-sdk`, `opentelemetry-semantic-conventions` — GenAI span export (Phase 2)
- `httpx` — OTLP HTTP exporter + FastAPI client (Phase 2+)
- `pydantic>=2` — schema validation (Phase 2+)
- `sqlmodel` — persistence (Phase 3)
- `fastapi` — self-hosted backend (Phase 3)
- `textual` — TUI (Phase 5)

If you are adding code, import only what you need and justify any new runtime dependency in the PR.

## Development

From the repo root:

```bash
uv sync
uv run pytest
uv run tracebloom --help
```
