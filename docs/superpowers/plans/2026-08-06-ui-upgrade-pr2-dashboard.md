# UI/UX Upgrade — PR2: Dashboard Redo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Dashboard (`/`) up to the new standard — replace the `--` placeholders during loading with `<DashboardSkeleton/>`, wrap every numeric stat in `<AnimatedNumber/>` so counts come alive on first paint, and add subtle hover/entry micro-animations to the cards.

**Architecture:** One new co-located file (`dashboard-skeleton.tsx`). One existing route file modified (`routes/_authenticated/index.tsx`). All primitives (`Skeleton`, `AnimatedNumber`, `useReducedMotion`, `DURATION`, `EASE`) consumed from PR1.

**Tech Stack:** React 19 + TanStack Router/Query + Tailwind 4 + @base-ui/react + zustand + vitest 4.1.10. Animation = pure CSS + Web Animations API.

## Global Constraints

- No new third-party UI / animation libraries may be added to `web/package.json`.
- All async loading states render via `<Skeleton/>` primitive + per-page `<XxxSkeleton/>` — never `<p>加载中...</p>`.
- All mutation success / failure surfaces via `toast.success / toast.error` from `@/components/ui/toast`.
- `prefers-reduced-motion: reduce` MUST be honored: every keyframe MUST have a reduced-motion override; JS-driven rAF animations MUST consult `useReducedMotion()`.
- z-index layers (defined in `styles/index.css` `@theme`): `--z-base: 0`, `--z-sticky: 20`, `--z-toast: 80`, `--z-dialog: 90`, `--z-modal: 100`.
- File-size caps: ui primitives ≤200, features ≤250, routes ≤300, stores/lib/hooks ≤200. ±20 lines reviewer override.
- Verification per PR: `cd web && bunx tsc --noEmit` 0 errors, `vp check` 0 errors, `vp lint --type-aware -f agent` 0 warnings, manual browser F1-F10 + dark mode + 390px + reduced-motion.
- Lore commit per task or per logical group.

---

## File Structure

**Create:**
- `web/src/routes/_authenticated/dashboard-skeleton.tsx` — `<DashboardSkeleton/>` mirroring the real layout (CTA card + 4 stat cards + exam info card).

**Modify:**
- `web/src/routes/_authenticated/index.tsx:1-205` — replace `progressLoading`/`chaptersLoading`/`statsLoading` text fallbacks with `<DashboardSkeleton/>`; wrap `dueCount`, `coverage`, `totalPoints`, `masteredPoints`, `totalQuestions`, `accuracy` numeric displays in `<AnimatedNumber/>`; add `animate-fadeIn` entry to each stat card.

**Imported from PR1 (consume, do not redefine):**
- `<Skeleton variant="text|rect|circle" />` from `@/components/ui/skeleton`
- `<AnimatedNumber value duration={400} />` from `@/components/ui/animated-number`
- `useReducedMotion()` from `@/hooks/use-reduced-motion`
- `DURATION`, `EASE` from `@/lib/motion`
- `animate-fadeIn` utility (defined in `styles/index.css` @theme)

---

## Tasks

### Task 1: `<DashboardSkeleton />` co-located component

**Files:**
- Create: `web/src/routes/_authenticated/dashboard-skeleton.tsx`
- Test: none (pure presentational JSX; parity verified in browser F1)

**Interfaces:**
- Consumes: `<Skeleton />` from PR1.
- Produces: `<DashboardSkeleton />` — no props. Mirrors real layout: hero CTA band + 2x2 / 4-col stat grid + exam info card.

- [ ] **Step 1: Implement**

```tsx
// web/src/routes/_authenticated/dashboard-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Page-level loading state for / (Dashboard). Equal-height to the resolved
 * view (CTA band + 4 stat cards in 2x2 / xl:4-col grid + exam info card) so
 * the swap causes zero CLS. Visual shimmer comes from PR1's <Skeleton/>.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fadeIn" role="status" aria-label="加载仪表盘中" aria-busy="true">
      {/* CTA band */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex items-center justify-between gap-4 p-5 pl-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" w={48} h={48} />
            <div className="min-w-0 space-y-2">
              <Skeleton variant="text" w={96} h={20} />
              <Skeleton variant="text" w={180} h={14} />
            </div>
          </div>
          <Skeleton variant="rect" w={96} h={40} r={6} />
        </CardContent>
      </Card>

      {/* 4 stat cards — mobile 2x2, xl 1x4 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-3">
              <Skeleton variant="text" w={64} h={14} />
              <Skeleton variant="rect" w={16} h={16} r={4} />
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <Skeleton variant="text" w={56} h={28} />
              <Skeleton variant="text" w={120} h={12} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam info card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <Skeleton variant="text" w={80} h={20} />
          <Skeleton variant="rect" w={80} h={32} r={6} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-border bg-muted/30 px-4 py-3">
              <Skeleton variant="text" w={64} h={16} />
              <Skeleton variant="rect" w={120} h={20} r={9999} className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(dashboard): add DashboardSkeleton (CTA + 4 stat cards + exam info)" \
  --body "Equal-height placeholder for / dashboard. Uses PR1 <Skeleton/> + animate-fadeIn. Mirrors existing 2-col mobile / xl:4-col grid + exam info row." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual F1 CLS parity (Task 3 verify)"
```

---

### Task 2: Wire `DashboardSkeleton` into the page

**Files:**
- Modify: `web/src/routes/_authenticated/index.tsx:1-15, 22-50, 58-204`

**Interfaces:**
- Consumes: `<DashboardSkeleton/>` from `./dashboard-skeleton`; existing TanStack Query hooks.
- Produces: same `<DashboardPage/>` export, same `useSetHeader`, same data shape.

- [ ] **Step 1: Add import**

At the top of the file, add (merging with the existing `@/routes/_authenticated/` import block — there is no such block currently, so add a new line):

```tsx
import { DashboardSkeleton } from './dashboard-skeleton';
```

- [ ] **Step 2: Add a single combined loading gate**

Right after the `useSetHeader` call (after line 56), add:

```tsx
if (progressLoading || chaptersLoading || statsLoading) {
  return <DashboardSkeleton />;
}
```

- [ ] **Step 3: Remove the now-unreachable per-stat `--` placeholders**

In the existing four stat cards (the JSX inside the `grid grid-cols-2 ... xl:grid-cols-4` block, roughly lines 91-168), the `progressLoading ? '--' : ...` and `chaptersLoading ? '--' : ...` and `statsLoading ? '--' : ...` ternaries can now assume `value !== null/undefined` (since the early-return above guards against loading). For each of the four `<span className="text-2xl font-bold tabular-nums sm:text-3xl">` blocks, drop the ternary and use the value directly.

The four sites are:
- Line ~99: `{progressLoading ? '--' : coverage}` → `{coverage}`
- Line ~116: `{progressLoading ? '--' : coverage}` → `{coverage}` (second occurrence)
- Line ~127: `{progressLoading ? '--' : \`已掌握 ${masteredPoints} / ${totalPoints} 知识点\`}` → `\`已掌握 ${masteredPoints} / ${totalPoints} 知识点\``
- Line ~141: `{chaptersLoading ? '--' : (chapters?.length ?? 0)}` → `{chapters?.length ?? 0}`
- Line ~157: `{statsLoading ? '--' : totalQuestions}` → `{totalQuestions}`

(Each of these is followed by a unit suffix like "张卡片" or "%" that remains unchanged.)

- [ ] **Step 4: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/routes/_authenticated/index.tsx`
Expected: 0 errors / 0 warnings. File should still be ≤ 300 lines (currently ~205, expected ~195 after the simplification).

```
lore commit \
  --intent "feat(dashboard): wire DashboardSkeleton, drop per-stat loading placeholders" \
  --body "Single early-return on (progressLoading || chaptersLoading || statsLoading) shows DashboardSkeleton; resolved view no longer needs 'isLoading ? -- : value' branches. TypeScript narrowing now guarantees the values exist." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 195" \
  --not-tested "manual F1 cold-load (Task 3 verify)"
```

---

### Task 3: AnimatedNumber wrapping on all dashboard stat values

**Files:**
- Modify: `web/src/routes/_authenticated/index.tsx:60-68, 96-130, 140-148, 156-168`

**Interfaces:**
- Consumes: `<AnimatedNumber value duration={500} />` from PR1.
- Produces: same DOM, but with rAF count-up on first paint.

- [ ] **Step 1: Add import**

At the top, add:

```tsx
import { AnimatedNumber } from '@/components/ui/animated-number';
```

- [ ] **Step 2: Wrap the four stat-card numbers**

For each of the four stat cards inside the `grid grid-cols-2 ... xl:grid-cols-4` block, replace the numeric `<span>` with `<AnimatedNumber>`. Concretely, in the four places:

A) "今日到期" card (lines ~98-100):
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">{dueCount}</span>
```
becomes:
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  <AnimatedNumber value={dueCount} duration={500} />
</span>
```

B) "学习进度" coverage (lines ~114-117):
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  {coverage}
</span>
```
becomes:
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  <AnimatedNumber value={coverage} duration={500} />
</span>
```

C) "知识体系" chapter count (lines ~139-143):
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  {chapters?.length ?? 0}
</span>
```
becomes:
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  <AnimatedNumber value={chapters?.length ?? 0} duration={500} />
</span>
```

D) "刷题情况" totalQuestions (lines ~155-159):
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  {totalQuestions}
</span>
```
becomes:
```tsx
<span className="text-2xl font-bold tabular-nums sm:text-3xl">
  <AnimatedNumber value={totalQuestions} duration={500} />
</span>
```

Also wrap `accuracy` (the "正确率 N%" label inside the same card) — its inner conditional is `accuracy !== undefined && hasPracticeData && (...)`; the `<span className="ml-auto text-sm font-medium text-success">` becomes:

```tsx
{accuracy !== undefined && hasPracticeData && (
  <span className="ml-auto text-sm font-medium text-success">
    正确率 <AnimatedNumber value={accuracy} duration={500} />%
  </span>
)}
```

- [ ] **Step 3: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual F1: cold-load `/`. Watch all five numbers count up over ~500ms (rAF + easeOutQuart). Toggle `prefers-reduced-motion: reduce` → numbers snap instantly.

```
lore commit \
  --intent "feat(dashboard): wrap stat values in AnimatedNumber" \
  --body "dueCount, coverage, chapter count, totalQuestions, accuracy all rAF animate 0→target on first paint. PR1 AnimatedNumber handles reduced-motion + document.hidden + off-screen automatically." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F1 cold-load (numbers count up), reduced-motion (snap instantly)" \
  --not-tested "Safari mid-frame"
```

---

### Task 4: Card hover/entry micro-animations

**Files:**
- Modify: `web/src/routes/_authenticated/index.tsx:60-65` (CTA card), `90` (stat grid), `172-202` (exam info card)

**Interfaces:**
- Consumes: `DURATION`, `EASE` from PR1 (TS-side, used to compute `style={{ transitionDuration: ... }}`).
- Produces: cards gain `hover:-translate-y-0.5 hover:shadow-md` + `transition-all`; the stat grid gets a subtle `animate-fadeIn` (cascade via per-card delay).

- [ ] **Step 1: Add imports**

```tsx
import { DURATION, EASE } from '@/lib/motion';
```

- [ ] **Step 2: CTA card hover**

Find the CTA Card opening tag (line ~63):

```tsx
<Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
```

Add `transition-all duration-200 hover:shadow-md` (using Tailwind duration class to match `DURATION.base = 200`):

```tsx
<Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent transition-all duration-200 hover:shadow-md">
```

- [ ] **Step 3: Stat card hover + per-card fade-in stagger**

For the 4 stat cards inside the grid (lines ~92, ~108, ~133, ~150), add to each `<Card>` className:

```tsx
className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeIn"
```

Additionally, add a per-card `style` to stagger the entrance. Easiest: pass an `index` to a small inline mapping. Replace the four hard-coded Card elements with a single `.map` over `[0, 1, 2, 3]` plus a `delay` per index:

```tsx
{[0, 1, 2, 3].map((i) => (
  <Card
    key={i}
    className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeIn"
    style={{ animationDelay: `${i * 40}ms` }}
  >
    ...
  </Card>
))}
```

(Note: the four Cards have different `CardHeader` and `CardContent` content. Instead of collapsing to a single map, keep them as four sibling `<Card>` elements, each with the shared className + `style={{ animationDelay: `${idx * 40}ms` }}`. The `idx` corresponds to the existing render order. Implementation detail: just add the shared className/style to each of the four Cards in place; do not restructure the four different bodies into a map. So this step is: edit each of the four `<Card>` opening tags in place.)

- [ ] **Step 4: Exam info card hover**

For the exam info card (line ~171):

```tsx
<Card>
```

becomes:

```tsx
<Card className="transition-all duration-200 hover:shadow-md">
```

- [ ] **Step 5: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/routes/_authenticated/index.tsx`
Expected: 0 errors / 0 warnings. File ≤ 300 lines (still around 200).

Manual F1: hover the CTA card → subtle shadow deepens. Hover each stat card → lifts 2px + shadow. Cold load → 4 stat cards fade in with 40ms cascade. Toggle `prefers-reduced-motion: reduce` → no fade, no hover lift, no shadow change (but the hover state still shows because Tailwind `hover:` is a separate selector from animation).

```
lore commit \
  --intent "feat(dashboard): subtle card hover/entry micro-animations" \
  --body "CTA + 4 stat cards + exam info card gain transition-all duration-200 hover:-translate-y-0.5 (stat only) hover:shadow-md. Stat cards stagger fadeIn by 40ms each via animationDelay. Reduced-motion honored by PR1 animations.css media query." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F1 hover + cold-load cascade, reduced-motion = static" \
  --not-tested "touch-device long-press (intentionally not special-cased — same as hover)"
```

---

## Self-Review (executed before saving)

1. **Spec coverage:** Dashboard `加载中...` → Skeleton (Task 1+2). Stats wrapped in AnimatedNumber (Task 3). Subtle micro-animations added (Task 4). All four spec §0.2 "目标" items addressed: skeleton, toast (PR1), animation feedback, dark mode (no change — existing token-driven colors already work in dark).
2. **No placeholders:** no "TBD" / "TODO" / "similar to Task N".
3. **Type consistency:** `useSetHeader`, query keys, `<Card/>` family, `<Badge/>` family, `<Link/>` all unchanged.
4. **Each step ≤5 minutes:** Task 3 wraps 5 sites; each is a 1-line edit.
5. **Each task ends with `lore commit`:** confirmed (4 tasks → 4 commits).
6. **File-size cap:** `index.tsx` currently ~205 lines → after Task 2 simplification maybe 195, after Task 3 still ~200, after Task 4 still ~200. Well under 300. `dashboard-skeleton.tsx` ~60 lines, under 200.

---

## Out of scope for PR2 (deferred)

- New "继续学习" / streak / heatmap features (spec §0.4 explicit non-goals).
- Keyboard shortcut "press G to go to /knowledge" (not in scope).
- Drag-reorder of stat cards (not in scope).
- Refactor of `useOverallProgress` or other queries (no behavior change requested).
- Extracting sub-components from the 4 stat cards (each is unique; YAGNI).

---

## Post-PR2 verification

1. `cd web && bunx tsc --noEmit` → 0 errors
2. `cd web && vp check` → 0 errors
3. `cd web && vp lint --type-aware -f agent` → 0 warnings
4. `cd web && vp test run` → 12 PR1 tests still green (no new PR2 tests per spec §4.2)
5. Manual F1 cold-load: skeleton → resolved view, no flash of `--` text, numbers count up 0→target over 500ms, 4 stat cards fade in cascade
6. Manual F1 hover: stat cards lift 2px + shadow
7. Manual F1 dark mode: unchanged (no new colors)
8. Manual F1 390px viewport: 2x2 stat grid still works
9. Manual F1 reduced-motion: all animations static, numbers snap, no fade
10. File-size: `wc -l src/routes/_authenticated/index.tsx` ≤ 300
