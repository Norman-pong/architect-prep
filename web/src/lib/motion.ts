// web/src/lib/motion.ts
// Shared animation tokens. The numeric values mirror the CSS @theme custom
// properties in styles/index.css so TS-side and CSS-side never drift.

export const DURATION = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export const EASE = {
  outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
