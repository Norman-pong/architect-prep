# UI/UX Upgrade — PR1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the cross-cutting feedback primitives (motion tokens, Skeleton, Toast, AnimatedNumber, ConfirmDialog, EmptyIllustration) plus the 401-aware axios interceptor so PR2-PR4 can stop emitting `加载中...` text, silent mutation failures, and `setTimeout(hint)` hacks.

**Architecture:** New files land under `web/src/lib/`, `web/src/hooks/`, `web/src/stores/`, `web/src/components/ui/`, `web/src/components/empty-state/`. Modifications to `web/src/main.tsx` (mount ToastViewport), `web/src/lib/api.ts` (toast interceptor, skip 401), `web/src/styles/index.css` (motion + z-index tokens + fadeIn keyframe), `web/src/components/ui/dialog.tsx` (z-50 → z-dialog), `web/src/components/empty-state/index.tsx` (add illustration slot, re-export EmptyIllustration).

**Tech Stack:** React 19 + TanStack Router/Query + Tailwind 4 + @base-ui/react + zustand + vitest 4.1.10 (transitive via vite-plus). Animation = pure CSS + Web Animations API only.

## Global Constraints

- No new third-party UI / animation libraries may be added to `web/package.json`.
- All async loading states render via `<Skeleton/>` primitive + per-page `<XxxSkeleton/>` — never `<p>加载中...</p>`.
- All mutation success / failure surfaces via `toast.success / toast.error` from `@/components/ui/toast`. Inline error states are allowed ONLY when they must stay adjacent to a form input (login form).
- `prefers-reduced-motion: reduce` MUST be honored: every keyframe in `styles/index.css` MUST have a reduced-motion override block; JS-driven rAF animations MUST consult `useReducedMotion()`.
- z-index layers (defined in `styles/index.css` `@theme`): `--z-base: 0`, `--z-sticky: 20`, `--z-toast: 80`, `--z-dialog: 90`, `--z-modal: 100`. Toast < Dialog < Modal; never collide.
- axios interceptor (`web/src/lib/api.ts`) MUST skip toast.error on 401 (401 still does hard-redirect to `/login`).
- File-size caps: ui primitives ≤200 lines, layout components ≤200, features ≤250, routes ≤300, stores/lib/hooks ≤200. ±20 lines reviewer override.
- Verification per PR: `cd web && bunx tsc --noEmit` 0 errors, `vp check` 0 errors, `vp lint --type-aware -f agent` 0 warnings, `vp test run` green (when tests are added), manual browser F1-F10 + dark mode + 390px + reduced-motion.
- Lore commit per task or per logical group (whichever produces a reviewable diff): `--intent`, `--body`, `--scope-risk`, `--reversibility`, plus `--tested` / `--not-tested` / `--constraint` / `--rejected` / `--directive` as relevant.

---

## File Structure

**Create:**
- `web/src/lib/motion.ts` — `DURATION` + `EASE` constants shared with CSS.
- `web/src/hooks/use-reduced-motion.ts` — `useReducedMotion()` returning `boolean` via `matchMedia`.
- `web/src/stores/toast-store.ts` — zustand `useToastStore` with `toasts: Toast[]`, `add`, `remove`, `clear`, plus a 500ms dedup helper.
- `web/src/components/ui/skeleton.tsx` — `<Skeleton variant="text|rect|circle" w h r className />` with shimmer keyframe + reduced-motion fallback.
- `web/src/components/ui/toast.tsx` — `toast.success|error|info|warning(msg, opts)` API + `<Toast variant message description onClose />`.
- `web/src/components/ui/toast-viewport.tsx` — `<ToastViewport />` createPortal renderer (mobile bottom-center / ≥sm top-right).
- `web/src/components/ui/animated-number.tsx` — `<AnimatedNumber value duration={400} decimals={0} />` rAF + easeOutQuart, mount-only, reduced-motion + visibility aware.
- `web/src/components/ui/confirm-dialog.tsx` — `<ConfirmDialog open onOpenChange title description confirmLabel cancelLabel="取消" variant onConfirm />` wrapping `@base-ui/react` Dialog.
- `web/src/components/empty-state/empty-illustration.tsx` — `<EmptyIllustration name="empty-questions"|"empty-wrong"|"empty-done" />` keyed inline SVGs (currentColor).

**Modify:**
- `web/src/styles/index.css` — add `@theme` tokens (`--ease-out-quart`, `--duration-fast/base/slow`, `--z-base/sticky/toast/dialog/modal`, `--animate-fadeIn`); add `@keyframes fadeIn/shimmer` + reduced-motion override; add `--animate-shimmer` Tailwind utility.
- `web/src/main.tsx:39-48` — wrap `<RouterProvider>` with `<ToastViewport />`.
- `web/src/lib/api.ts:46-56` — extend response interceptor: on non-401 error, call `toast.error('操作失败,请重试')`. 401 still does hard-redirect.
- `web/src/components/ui/dialog.tsx:32,51` — replace `z-50` with `z-dialog` (token-based).
- `web/src/components/empty-state/index.tsx` — add `illustration?: ReactNode` prop (alias for `icon`), re-export `EmptyIllustration` from `./empty-illustration`.

**Test:**
- `web/src/components/ui/__tests__/toast-store.test.ts` — dedup + remove + auto-dismiss.
- `web/src/components/ui/__tests__/animated-number.test.tsx` — rAF tick + reduced-motion fallback + `document.hidden` skip.
- `web/src/components/ui/__tests__/skeleton.test.tsx` — variant default sizes + className passthrough.

---

## Tasks

### Task 1: motion constants + reduced-motion hook

**Files:**
- Create: `web/src/lib/motion.ts`
- Create: `web/src/hooks/use-reduced-motion.ts`
- Test: none (pure constant + media-query hook; verified by lint + browser dev-tools)

**Interfaces:**
- Produces: `DURATION = { fast: 120, base: 200, slow: 320 } as const`, `EASE = { outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)', inOut: 'cubic-bezier(0.4, 0, 0.2, 1)' } as const`.
- Produces: `useReducedMotion(): boolean` (returns `true` when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`).

- [ ] **Step 1: Implement `lib/motion.ts`**

```ts
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
```

- [ ] **Step 2: Implement `hooks/use-reduced-motion.ts`**

```ts
// web/src/hooks/use-reduced-motion.ts
import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion: reduce`. Returns `true` when the user
 * has requested reduced motion in their OS or browser. CSS keyframes are
 * collapsed to static in `styles/index.css` regardless — this hook is only
 * consulted by JS-driven (rAF) animations like <AnimatedNumber />.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    function onChange(e: MediaQueryListEvent) {
      setReduced(e.matches);
    }
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 3: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(ui): add motion constants + useReducedMotion hook" \
  --body "Shared DURATION/EASE for TS+CSS parity. useReducedMotion via matchMedia; consulted only by rAF animations (CSS keyframes are auto-reduced by index.css media query)." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual devtools reduced-motion toggle (deferred to PR1 Task 10)"
```

---

### Task 2: CSS tokens + keyframes + reduced-motion override

**Files:**
- Modify: `web/src/styles/index.css` (append after the existing `@theme inline` block; lines 162-197)

**Interfaces:**
- Produces: in `@theme`:
  - `--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)`
  - `--duration-fast: 120ms`, `--duration-base: 200ms`, `--duration-slow: 320ms`
  - `--z-base: 0`, `--z-sticky: 20`, `--z-toast: 80`, `--z-dialog: 90`, `--z-modal: 100`
  - `--animate-fadeIn: fadeIn 320ms var(--ease-out-quart) both`
  - `--animate-shimmer: shimmer 1500ms linear infinite`
- Produces: `@keyframes fadeIn` (opacity 0→1) and `@keyframes shimmer` (bg-position 0→100%) outside `@theme`.
- Produces: `@media (prefers-reduced-motion: reduce)` block neutralizing both keyframes.

- [ ] **Step 1: Append to `styles/index.css` after line 197**

Add the following block immediately AFTER the closing `}` of the `@theme inline` block (which ends at line 197) and BEFORE the `/* ============================================ Base Styles ============================================ */` comment (line 199):

```css
/* ============================================
 * Motion + Z-index Tokens (PR1 Foundation)
 * 动效时长 / easing / z-index 分层;与 web/src/lib/motion.ts 同步
 * ============================================ */

@theme {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;

  --z-base: 0;
  --z-sticky: 20;
  --z-toast: 80;
  --z-dialog: 90;
  --z-modal: 100;

  --animate-fadeIn: fadeIn 320ms var(--ease-out-quart) both;
  --animate-shimmer: shimmer 1500ms linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 单源 reduced-motion 处理:CSS keyframes 全部塌缩成静态。 */
@media (prefers-reduced-motion: reduce) {
  @keyframes fadeIn {
    from, to { opacity: 1; }
  }
  @keyframes shimmer {
    0%, 100% { background-position: 0 0; }
  }
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual: open `vp dev`, inspect `<div class="animate-fadeIn">` in DevTools → Animations panel — should show `fadeIn 320ms cubic-bezier(0.25, 1, 0.5, 1) both`. Toggle `prefers-reduced-motion: reduce` (DevTools Rendering tab) → animation becomes flat (no duration).

```
lore commit \
  --intent "feat(styles): motion + z-index tokens + reduced-motion overrides" \
  --body "Adds @theme tokens for ease, duration, z layers, and Tailwind animate-fadeIn/animate-shimmer utilities. Single @media (prefers-reduced-motion: reduce) block neutralizes all keyframes per spec §3.4." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, DevTools Animations panel shows 320ms ease-out-quart on .animate-fadeIn" \
  --not-tested "all consumers (added in Tasks 3-9)"
```

---

### Task 3: Skeleton primitive

**Files:**
- Create: `web/src/components/ui/skeleton.tsx`
- Create: `web/src/components/ui/__tests__/skeleton.test.tsx`

**Interfaces:**
- Produces: `<Skeleton variant="text"|"rect"|"circle" w?: number|string h?: number|string r?: number|string className?: string />`.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/ui/__tests__/skeleton.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('renders with default text variant (h=16, w=full, r=4)', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('h-4');           // 16px = h-4
    expect(el).toHaveClass('w-full');
    expect(el).toHaveClass('rounded');        // 4px = rounded
    expect(el).toHaveClass('animate-shimmer');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-label', '加载中');
  });

  it('circle variant defaults to w=h=40', () => {
    const { container } = render(<Skeleton variant="circle" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('h-10');
    expect(el).toHaveClass('w-10');
    expect(el).toHaveClass('rounded-full');
  });

  it('explicit w/h override defaults', () => {
    const { container } = render(<Skeleton variant="rect" w={120} h={32} r={8} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
    expect(el).toHaveClass('rounded-lg');    // r=8 = rounded-lg
  });

  it('passes className through', () => {
    const { container } = render(<Skeleton className="ml-auto" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('ml-auto');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && vp test run src/components/ui/__tests__/skeleton.test.tsx`
Expected: FAIL with `Failed to resolve import "../skeleton"`.

- [ ] **Step 3: Implement `skeleton.tsx`**

```tsx
// web/src/components/ui/skeleton.tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Width in px or any CSS length string. Defaults per variant. */
  w?: number | string;
  /** Height in px or any CSS length string. Defaults per variant. */
  h?: number | string;
  /** Border-radius in px. Defaults per variant. */
  r?: number | string;
}

/**
 * Loading placeholder. Shimmer keyframe is consumed via the `animate-shimmer`
 * utility (defined in `styles/index.css`); the reduced-motion media query
 * collapses the keyframe to a static state automatically.
 */
export function Skeleton({
  variant = 'text',
  w,
  h,
  r,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const defaults = {
    text:   { w: '100%', h: 16,  r: 4 },
    rect:   { w: '100%', h: 16,  r: 4 },
    circle: { w: 40,     h: 40,  r: 9999 },
  }[variant];

  const finalW = w ?? defaults.w;
  const finalH = h ?? defaults.h;
  const finalR = r ?? defaults.r;

  const radiusClass =
    finalR === 9999
      ? 'rounded-full'
      : finalR <= 4
        ? 'rounded'
        : finalR <= 6
          ? 'rounded-md'
          : finalR <= 12
            ? 'rounded-lg'
            : 'rounded-xl';

  return (
    <div
      role="status"
      aria-label="加载中"
      className={cn(
        'shrink-0 animate-shimmer bg-muted/60 bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]',
        radiusClass,
        variant === 'circle' && 'rounded-full',
        className,
      )}
      style={{ width: typeof finalW === 'number' ? `${finalW}px` : finalW,
               height: typeof finalH === 'number' ? `${finalH}px` : finalH,
               ...style }}
      {...rest}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && vp test run src/components/ui/__tests__/skeleton.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(ui): add Skeleton primitive (text/rect/circle + shimmer + a11y)" \
  --body "Explicit variant primitive; rounded-* derived from r prop. role=status + aria-label for a11y. animate-shimmer keyframe consumed from styles/index.css (auto reduced-motion)." \
  --scope-risk narrow --reversibility clean \
  --tested "vp test 4 passing, tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual CLS parity (deferred to PR2/3/4 consumers)"
```

---

### Task 4: Toast store (zustand + dedup)

**Files:**
- Create: `web/src/stores/toast-store.ts`
- Create: `web/src/components/ui/__tests__/toast-store.test.ts`

**Interfaces:**
- Produces: `useToastStore` zustand store: `toasts: Toast[]`, `add(t)`, `remove(id)`, `clear()`.
- Produces: `addToast({ variant, message, description?, durationMs })` helper with 500ms same-`(msg+variant)` dedup.

- [ ] **Step 1: Write the failing test**

```ts
// web/src/components/ui/__tests__/toast-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, addToast, type Toast } from '@/stores/toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    useToastStore.getState().clear();
    vi.useFakeTimers();
  });

  it('adds a toast', () => {
    addToast({ variant: 'success', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].variant).toBe('success');
    expect(useToastStore.getState().toasts[0].message).toBe('hi');
  });

  it('dedups same (msg+variant) within 500ms', () => {
    addToast({ variant: 'success', message: 'hi' });
    addToast({ variant: 'success', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('does not dedup different variants', () => {
    addToast({ variant: 'success', message: 'hi' });
    addToast({ variant: 'info',    message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it('does not dedup after dedup window expires', () => {
    addToast({ variant: 'success', message: 'hi' });
    vi.advanceTimersByTime(600);
    addToast({ variant: 'success', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it('auto-removes after durationMs', () => {
    addToast({ variant: 'success', message: 'hi', durationMs: 1000 });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && vp test run src/components/ui/__tests__/toast-store.test.ts`
Expected: FAIL with `Failed to resolve import`.

- [ ] **Step 3: Implement `stores/toast-store.ts`**

```ts
// web/src/stores/toast-store.ts
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  durationMs: number;
  createdAt: number;
}

interface ToastStoreState {
  toasts: Toast[];
  add: (t: Toast) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 3500;
const DEDUP_WINDOW_MS = 500;

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  add: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/**
 * Add a toast. Dedups the same (msg + variant) within 500ms.
 * Caller passes a fully-formed Toast (id + createdAt stamped here).
 */
export function addToast(input: {
  variant: ToastVariant;
  message: string;
  description?: string;
  durationMs?: number;
}) {
  const now = Date.now();
  const existing = useToastStore.getState().toasts.find(
    (t) => t.message === input.message && t.variant === input.variant,
  );
  if (existing && now - existing.createdAt < DEDUP_WINDOW_MS) {
    return;
  }
  const toast: Toast = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `t-${now}-${Math.random().toString(36).slice(2, 8)}`,
    variant: input.variant,
    message: input.message,
    description: input.description,
    durationMs: input.durationMs ?? DEFAULT_DURATION,
    createdAt: now,
  };
  useToastStore.getState().add(toast);
  // Auto-dismiss
  if (toast.durationMs > 0 && typeof window !== 'undefined') {
    window.setTimeout(() => {
      useToastStore.getState().remove(toast.id);
    }, toast.durationMs);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && vp test run src/components/ui/__tests__/toast-store.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(stores): zustand toast store with 500ms dedup + auto-dismiss" \
  --body "useToastStore holds toasts: Toast[]; addToast helper dedups same (msg+variant) within 500ms and auto-removes after durationMs. No persist middleware (per spec §2.1.2)." \
  --scope-risk narrow --reversibility clean \
  --tested "vp test 5 passing, tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "viewport rendering (deferred to Task 5)"
```

---

### Task 5: toast API + ToastViewport + main.tsx mount

**Files:**
- Create: `web/src/components/ui/toast.tsx`
- Create: `web/src/components/ui/toast-viewport.tsx`
- Modify: `web/src/main.tsx:42-48` (wrap `<RouterProvider>` with `<ToastViewport />`)

**Interfaces:**
- Produces: `toast.success|error|info|warning(message, opts?: { description?, durationMs? })` thin wrappers over `addToast`.
- Produces: `<Toast variant message description onClose />` (single toast item, with × close button + role/aria-live).
- Produces: `<ToastViewport />` createPortal renderer (mobile bottom-center; ≥sm top-right).

- [ ] **Step 1: Implement `toast.tsx`**

```tsx
// web/src/components/ui/toast.tsx
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ToastVariant, useToastStore, addToast } from '@/stores/toast-store';

// Public API (consumed by features)
export const toast = {
  success: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'success', message, ...opts }),
  error: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'error', message, ...opts }),
  info: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'info', message, ...opts }),
  warning: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'warning', message, ...opts }),
};

interface ToastProps {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success/40 bg-card text-foreground',
  error:   'border-destructive/40 bg-card text-foreground',
  info:    'border-info/40    bg-card text-foreground',
  warning: 'border-warning/40 bg-card text-foreground',
};

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  success: 'bg-success',
  error:   'bg-destructive',
  info:    'bg-info',
  warning: 'bg-warning',
};

export function Toast({ id, variant, message, description }: ToastProps) {
  const remove = useToastStore((s) => s.remove);
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-card px-4 py-3 shadow-lg animate-fadeIn',
        VARIANT_STYLES[variant],
      )}
    >
      <span aria-hidden className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', VARIANT_ACCENT[variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => remove(id)}
        aria-label="关闭"
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Implement `toast-viewport.tsx`**

```tsx
// web/src/components/ui/toast-viewport.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from '@/stores/toast-store';
import { Toast } from './toast';

/**
 * Mounted once at the root (main.tsx). Positioned: bottom-center on mobile,
 * top-right ≥sm. Renders via createPortal into document.body so it's
 * never trapped by a parent stacking context.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-label="通知"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-toast flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="w-full max-w-[min(420px,calc(100vw-32px))]"
        >
          <Toast id={t.id} variant={t.variant} message={t.message} description={t.description} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
```

- [ ] **Step 3: Mount in `main.tsx`**

Replace the existing render block (lines 42-47):

```tsx
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

with:

```tsx
import { ToastViewport } from '@/components/ui/toast-viewport';
// (keep the rest of the imports)

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastViewport />
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 4: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual: open `vp dev` → in DevTools console run `await import('/src/components/ui/toast').then(m => m.toast.success('hello'))` — toast appears bottom-center on mobile / top-right ≥sm. Toggle `prefers-reduced-motion: reduce` → toast still shows, no fade animation. `console.log(useToastStore)` shouldn't be set globally; it's a module export.

```
lore commit \
  --intent "feat(ui): toast API + ToastViewport mounted in main.tsx" \
  --body "toast.success|error|info|warning thin wrappers over addToast. <ToastViewport/> createPortal'd to body, mobile bottom-center / sm: top-right, z-toast=80. Reduced-motion collapses fadeIn via index.css media query (auto)." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual vp dev + console import toast.success shows toast at correct position" \
  --not-tested "axe a11y (visual manual only), hover-pause (not implemented yet — Tasks 6 will not add; consider future PR)"
```

---

### Task 6: AnimatedNumber primitive

**Files:**
- Create: `web/src/components/ui/animated-number.tsx`
- Create: `web/src/components/ui/__tests__/animated-number.test.tsx`

**Interfaces:**
- Produces: `<AnimatedNumber value={n} duration={400} decimals={0} className? />` — rAF + easeOutQuart, mount-only, reduced-motion + `document.hidden` + off-screen aware.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/ui/__tests__/animated-number.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AnimatedNumber } from '../animated-number';

describe('AnimatedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Force reduced-motion = false in jsdom
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the final value after animation completes', () => {
    const { container } = render(<AnimatedNumber value={42} duration={400} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.textContent).toBe('42');
  });

  it('respects decimals prop', () => {
    const { container } = render(<AnimatedNumber value={1.5} duration={100} decimals={1} />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(container.textContent).toBe('1.5');
  });

  it('skips animation when reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<AnimatedNumber value={99} duration={1000} />);
    // Should render target value immediately, no rAF wait.
    expect(container.textContent).toBe('99');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && vp test run src/components/ui/__tests__/animated-number.test.tsx`
Expected: FAIL with `Failed to resolve import`.

- [ ] **Step 3: Implement `animated-number.tsx`**

```tsx
// web/src/components/ui/animated-number.tsx
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { EASE } from '@/lib/motion';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Counts up from 0 to `value` on mount using rAF + easeOutQuart. Only plays
 * once per mount — subsequent prop changes do NOT re-animate (use a `key`
 * prop at the call site to force a re-mount if you want it to re-play).
 * Respects prefers-reduced-motion and pauses when document is hidden or
 * the element is off-screen.
 */
export function AnimatedNumber({
  value,
  duration = 400,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const elRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    // Skip if document is hidden
    if (typeof document !== 'undefined' && document.hidden) {
      setDisplay(value);
      return;
    }
    // Skip if off-screen (getBoundingClientRect is available in all browsers + jsdom)
    const el = elRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setDisplay(value);
        return;
      }
    }

    startRef.current = null;
    const start = performance.now();

    function step(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutQuart(t);
      const current = eased * value;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
        rafRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only per spec

  return (
    <span ref={elRef} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display.toFixed(decimals)}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && vp test run src/components/ui/__tests__/animated-number.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(ui): AnimatedNumber rAF + easeOutQuart, reduced-motion / hidden / off-screen aware" \
  --body "Counts up 0→value on mount only. Skips when prefers-reduced-motion matches, document.hidden is true, or element is off-screen. tabular-nums for stable width." \
  --scope-risk narrow --reversibility clean \
  --tested "vp test 3 passing, tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual CLS on stats page (consumer PR4 will verify)"
```

---

### Task 7: ConfirmDialog primitive

**Files:**
- Create: `web/src/components/ui/confirm-dialog.tsx`

**Interfaces:**
- Produces: `<ConfirmDialog open onOpenChange title description confirmLabel cancelLabel="取消" variant="default"|"destructive" onConfirm />`.

- [ ] **Step 1: Implement `confirm-dialog.tsx`**

```tsx
// web/src/components/ui/confirm-dialog.tsx
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

/**
 * Generic confirm dialog. Backed by @base-ui Dialog primitive (no new
 * dependency). Variant=destructive tints the confirm button red.
 * Used to replace window.confirm() patterns (logout, clear cache, etc).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-dialog bg-foreground/40 backdrop-blur-sm transition-opacity data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
        <BaseDialog.Popup className="fixed left-1/2 top-1/2 z-dialog grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg transition-all data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2">
          <BaseDialog.Title className="text-base font-semibold text-foreground">{title}</BaseDialog.Title>
          {description && (
            <BaseDialog.Description className="text-sm text-muted-foreground">{description}</BaseDialog.Description>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <BaseDialog.Close
              className="inline-flex h-9 items-center rounded-md border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {cancelLabel}
            </BaseDialog.Close>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(ui): add ConfirmDialog primitive (wraps @base-ui Dialog)" \
  --body "Generic confirm/cancel dialog. variant=destructive tints confirm button red. cancelLabel default 取消. z-dialog=90 ensures it sits above toast viewport (z-toast=80)." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "consumer (PR4 settings/logout will verify)"
```

---

### Task 8: EmptyIllustration + EmptyState slot

**Files:**
- Create: `web/src/components/empty-state/empty-illustration.tsx`
- Modify: `web/src/components/empty-state/index.tsx` — add `illustration?: ReactNode` prop + re-export `EmptyIllustration`

**Interfaces:**
- Produces: `<EmptyIllustration name="empty-questions"|"empty-wrong"|"empty-done" className? />` (inline SVG, currentColor).
- Produces: `<EmptyState title description illustration? icon? actionLabel? onAction? />` — `illustration` is preferred over `icon` when both passed.

- [ ] **Step 1: Implement `empty-illustration.tsx`**

```tsx
// web/src/components/empty-state/empty-illustration.tsx
import { cn } from '@/lib/utils';

export type EmptyIllustrationName = 'empty-questions' | 'empty-wrong' | 'empty-done';

export interface EmptyIllustrationProps {
  name: EmptyIllustrationName;
  className?: string;
}

/**
 * Three pre-defined muted SVG illustrations for empty states. Inherits
 * `currentColor` so the caller (typically <EmptyState/> wrapper with
 * `text-muted-foreground/60`) controls the color via Tailwind class.
 */
export function EmptyIllustration({ name, className }: EmptyIllustrationProps) {
  if (name === 'empty-questions') {
    return (
      <svg className={cn('h-12 w-12', className)} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="12" y="8" width="40" height="48" rx="4" />
        <path d="M20 22h24M20 32h24M20 42h16" />
        <circle cx="48" cy="48" r="8" fill="currentColor" opacity="0.3" />
        <path d="M44 48l3 3 6-6" />
      </svg>
    );
  }
  if (name === 'empty-wrong') {
    return (
      <svg className={cn('h-12 w-12', className)} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="32" cy="32" r="22" />
        <path d="M22 22l20 20M42 22l-20 20" />
      </svg>
    );
  }
  // empty-done
  return (
    <svg className={cn('h-12 w-12', className)} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="32" cy="32" r="22" />
      <path d="M22 33l8 8 14-16" />
    </svg>
  );
}
```

- [ ] **Step 2: Update `empty-state/index.tsx`**

Add to the top imports:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyIllustration, type EmptyIllustrationName } from './empty-illustration';

export { EmptyIllustration };
export type { EmptyIllustrationName };
```

Replace the `EmptyStateProps` interface:

```tsx
export interface EmptyStateProps {
  /** Optional icon — pass an inline <svg /> so callers control the visual. */
  icon?: React.ReactNode;
  /** Preferred over `icon` when both are passed. */
  illustration?: React.ReactNode;
  /** Headline shown to the user */
  title: string;
  /** Supporting copy below the title */
  description?: string;
  /** Optional CTA label. Pairs with onAction. */
  actionLabel?: string;
  /** Optional CTA handler */
  onAction?: () => void;
  /** Optional extra class names for the root */
  className?: string;
}
```

And update the function signature + body:

```tsx
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const visual = illustration ?? icon;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center',
        className,
      )}
    >
      {visual ? (
        <div className="text-muted-foreground/60">{visual}</div>
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
```

Note: this also DROPS the previously hard-coded `[&_svg]:h-12 [&_svg]:w-12` because callers now control the size via `icon` / `illustration` content (the SVGs ship with `h-12 w-12` baked in).

- [ ] **Step 3: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(empty-state): add illustration slot + EmptyIllustration keyed SVGs" \
  --body "Three keyed inline SVGs (currentColor). EmptyState now takes `illustration?` prop (preferred over `icon`). Drops the forced [&_svg] sizing — callers pass pre-sized SVG via icon/illustration." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "all current consumers (existing call sites still use `icon` — backward compatible)"
```

---

### Task 9: dialog.tsx z-50 → z-dialog + axios interceptor

**Files:**
- Modify: `web/src/components/ui/dialog.tsx:32,51` — replace `z-50` with `z-dialog`
- Modify: `web/src/lib/api.ts:46-56` — add `toast.error` on non-401 errors

- [ ] **Step 1: Update `dialog.tsx`**

In `web/src/components/ui/dialog.tsx`, change the `DialogBackdrop` className at line 32:

```tsx
// from:
'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm',
// to:
'fixed inset-0 z-dialog bg-foreground/40 backdrop-blur-sm',
```

And the `DialogPopup` className at line 51 — replace both `z-50` occurrences:

```tsx
// from:
'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg',
// to:
'fixed left-1/2 top-1/2 z-dialog grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg',
```

- [ ] **Step 2: Update `lib/api.ts` — add toast interceptor**

In `web/src/lib/api.ts`, add an import at the top:

```ts
import { toast } from '@/components/ui/toast';
```

Replace the response interceptor block (lines 47-56):

```ts
// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

with:

```ts
// Handle 401 (hard redirect) + surface non-401 errors as toast.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    // Non-401: surface a generic toast (callers may still add specific toasts).
    if (error.response && typeof error.response.status === 'number' && error.response.status >= 400) {
      toast.error('操作失败,请重试');
    }
    return Promise.reject(error);
  },
);
```

- [ ] **Step 3: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual: open `vp dev` and trigger any 4xx (e.g. try `/login` with the backend down → 500) → toast.error appears. 401 still does `window.location.href = '/login'`.

```
lore commit \
  --intent "feat(api): toast.error interceptor + dialog uses z-dialog token" \
  --body "axios interceptor surfaces non-401 errors as toast.error('操作失败,请重试'); 401 still does hard-redirect to /login (NOT a toast). Dialog primitive now uses z-dialog (90) so it sits above toast (80) per spec z-index layer rules." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "consumer pages (PR2-4 will surface via real fetches)"
```

---

### Task 10: PR1 final verification + cleanup

- [ ] **Step 1: Run all PR1 tests + full check**

```bash
cd /Users/norman/workspace/zhimingcool/architect-prep/web
bunx tsc --noEmit
vp check
vp lint --type-aware -f agent
vp test run
```

Expected: 0 errors, 0 warnings, all 12 tests passing (4 skeleton + 5 toast-store + 3 animated-number).

- [ ] **Step 2: File-size cap audit**

```bash
cd /Users/norman/workspace/zhimingcool/architect-prep/web
wc -l src/lib/motion.ts \
      src/hooks/use-reduced-motion.ts \
      src/stores/toast-store.ts \
      src/components/ui/skeleton.tsx \
      src/components/ui/toast.tsx \
      src/components/ui/toast-viewport.tsx \
      src/components/ui/animated-number.tsx \
      src/components/ui/confirm-dialog.tsx \
      src/components/empty-state/empty-illustration.tsx
```

Expected: every file ≤ 200 lines. If any is over, split per spec §1.3.

- [ ] **Step 3: Manual F1-F10 smoke**

Open `vp dev` and walk F1 (register/login), F2 (knowledge browse), F3 (practice), F4 (wrong-questions), F5 (stats), F6 (review), F7 (settings), F8 (logout), F9 (dark mode toggle), F10 (mobile 390px viewport). At each page: no `加载中...` text in DOM (DevTools), toast appears when expected, Skeleton renders during loading, ConfirmDialog doesn't trap keyboard, brand panel fades in on login.

- [ ] **Step 4: Final commit (if any cleanup done)**

```
lore commit \
  --intent "chore(PR1): final verification + file-size audit + manual F1-F10 smoke" \
  --body "tsc 0, vp check 0, vp lint 0, 12 tests passing, all PR1 files ≤ 200 lines. F1-F10 manual smoke clean." \
  --scope-risk narrow --reversibility clean \
  --tested "all gates green + manual F1-F10" \
  --not-tested "load test (out of scope for UI PR)"
```

---

## Self-Review (executed before finalizing)

1. **Spec coverage:** Every PR1 deliverable from spec §2.1 covered in Tasks 1-9. PR1 verify (spec §4.3) covered in Task 10. Motion + z-index tokens (spec §2.1.6 / §2.1.7) in Task 2. EmptyIllustration (spec §2.1.5) in Task 8. axios interceptor (spec §4.1) in Task 9.
2. **No placeholders:** No "TBD" / "TODO" / "similar to Task N" anywhere.
3. **Type consistency:** `DURATION` / `EASE` consumed only in animated-number (Task 6). `toast.*` API used consistently in Tasks 4-5, 9, and consumers (PR2-4).
4. **Each step ≤5 minutes:** Largest single step is Task 8 Step 2 (full rewrite of empty-state/index.tsx) which is one focused edit.
5. **Each task ends with `lore commit`:** confirmed.
6. **File-size caps:** Skeleton ~50, toast ~50, toast-viewport ~30, animated-number ~75, confirm-dialog ~55, empty-illustration ~30 — all well under 200.

---

## Out of scope for PR1 (deferred)

- `useEnterAnimation` hook — not needed (no per-page entrance animation in PR1; PR2 may add ad-hoc).
- `PageTransition` / route-level fade — explicitly rejected per spec §2.2.
- `<ProgressRing />` extraction from `stats.tsx` — YAGNI per spec §2.2.
- Additional vitest files beyond skeleton/toast-store/animated-number — spec §4.2 only requires these three.

---

## Post-PR1 verification

1. `cd web && bunx tsc --noEmit` → 0 errors
2. `cd web && vp check` → 0 errors
3. `cd web && vp lint --type-aware -f agent` → 0 warnings
4. `cd web && vp test run` → 12 tests passing
5. Manual F1-F10: no `加载中...` text appears, toast works, ConfirmDialog opens, dark mode + 390px + reduced-motion all clean
