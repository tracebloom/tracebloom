# @tracebloom/dashboard

The web half of tracebloom. One codebase, two build targets.

## Builds

| Command             | Output                      | What it is                                                    |
| ------------------- | --------------------------- | ------------------------------------------------------------- |
| `pnpm build`        | `dist/dashboard/`           | The self-hosted dashboard (served by the Python package).     |
| `pnpm build:viewer` | `dist/viewer/viewer.html`   | A single-file HTML viewer. Email it, drop it in Slack, open it offline. Must stay under 200KB. |

## Development

```bash
pnpm install
pnpm dev              # dashboard at http://localhost:5173
pnpm typecheck
pnpm build
pnpm build:viewer
```

## Design tokens

Tokens live in `src/tokens.css` (CSS custom properties) and `src/lib/tokens.ts` (TypeScript mirror). See `docs/design-tokens.md` for the locked set.

## Structure

- `src/main.tsx` — dashboard entry (uses Tailwind + React Router)
- `src/viewer.tsx` — viewer entry (tokens.css only, no Tailwind, no router — size-constrained)
- `src/tokens.css` — design tokens
- `src/lib/tokens.ts` — TS mirror
- `src/styles.css` — Tailwind import + base resets (dashboard only)
