# Design tokens

These tokens are locked for v1.0. They live in `packages/dashboard/src/tokens.css` (as CSS custom properties) and `packages/dashboard/src/lib/tokens.ts` (as TypeScript constants). Any visual change to the dashboard or viewer must reach for a token before a literal value.

## Palette

| Token             | Value        | Use                                |
| ----------------- | ------------ | ---------------------------------- |
| `--bg`            | `#0B0D10`    | Page background                    |
| `--surface`       | `#14171C`    | Cards, panels, elevated surfaces   |
| `--border`        | `#1F242B`    | Dividers, input outlines           |
| `--text-primary` | `#E6E8EB`    | Primary copy, headings             |
| `--text-secondary` | `#8B94A0`  | Secondary copy, placeholder text   |
| `--accent`        | `#FF6B3D`    | Primary CTAs, active flame-graph   |
| `--success`       | `#3DDC84`    | Passing checks, healthy traces     |
| `--warning`       | `#FFB94A`    | Drift alerts, degraded runs        |
| `--error`         | `#FF5470`    | Failed runs, validation errors     |

## Typography

- **UI:** Inter (self-hosted, no CDN)
- **Code:** JetBrains Mono (self-hosted, no CDN)

## Radius

| Token         | Value |
| ------------- | ----- |
| `--radius-1`  | `4px` |
| `--radius-2`  | `8px` |
| `--radius-3` | `12px` |
| `--radius-4` | `16px` |

## Spacing

| Token          | Value  |
| -------------- | ------ |
| `--space-1`    | `4px`  |
| `--space-2`    | `8px`  |
| `--space-3`   | `12px` |
| `--space-4`   | `16px` |
| `--space-5`   | `24px` |
| `--space-6`   | `32px` |
| `--space-7`   | `48px` |

## Shadow

One elevation:

```
--shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25);
```

## Motion

- **Hover:** 120ms
- **Panel transitions:** 200ms
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)`
