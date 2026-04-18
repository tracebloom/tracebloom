# Contributing to tracebloom

Thanks for considering a contribution. tracebloom is pre-alpha and moves fast — this document keeps the process short.

## Dev setup (5 commands)

```bash
git clone https://github.com/tracebloom/tracebloom.git
cd tracebloom
uv sync                          # installs Python deps into .venv
pnpm install                     # installs dashboard deps
pre-commit install               # enables lint/format/type hooks
```

Python 3.10+ and Node 20+ are required. `.python-version` and `.nvmrc` are pinned.

## Running things

```bash
uv run tracebloom --help          # CLI
uv run pytest                     # Python tests
pnpm --filter @tracebloom/dashboard dev          # dashboard dev server
pnpm --filter @tracebloom/dashboard build:viewer # single-file viewer build
```

## PR conventions

- One logical change per PR. Stacked PRs are welcome for larger work.
- Commit messages use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`, `ci:`.
- Every PR must pass CI: ruff, mypy strict, pytest, tsc, and dashboard build.
- Add a test when you fix a bug. Add a test when you add a feature.

## Adapters

tracebloom integrates with agent frameworks via a small adapter API. See `docs/adapters.md` for the current contract. Adapter requests are a great first contribution — open an issue using the "Adapter request" template first so we can coordinate.

## Taste rule

> If it isn't screenshotable, it isn't done.

The dashboard, the viewer, the CLI output — all of these should look like a product, not a lab notebook. If you ship a change to a user-facing surface, include a screenshot in the PR description.

## Reporting bugs

Use the "Bug report" issue template. Include the tracebloom version, Python version, OS, a minimal reproduction, and the actual vs expected behavior.

## Code of Conduct

By participating, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
