/**
 * Design tokens mirrored from src/tokens.css for programmatic access.
 * Source of truth is tokens.css; keep these in sync.
 */

export const palette = {
  bg: "#0B0D10",
  surface: "#14171C",
  border: "#1F242B",
  textPrimary: "#E6E8EB",
  textSecondary: "#8B94A0",
  accent: "#FF6B3D",
  success: "#3DDC84",
  warning: "#FFB94A",
  error: "#FF5470",
} as const;

export const radius = {
  r1: 4,
  r2: 8,
  r3: 12,
  r4: 16,
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 48,
} as const;

export const shadow =
  "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)";

export const motion = {
  hover: "120ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  panel: "200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export const font = {
  ui: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  code: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;
