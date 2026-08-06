# UI/UX Upgrade — PR4: Wrong-Questions / Stats / Settings / Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every `加载中...` text, every silent mutation failure, every `setTimeout(hint)` hack, and every bare `<button onClick={logout}>` in the four secondary pages with the PR1 primitives so all pages match the dashboard's quality bar — observable as: zero inline loading/error text, zero `window.confirm`, skeleton placeholders matching real layout, and toast feedback on every mutation.

**Architecture:** No new primitives. PR4 strictly *consumes* the foundations shipped by PR1. Two co-located skeletons added (`wrong-questions-skeleton.tsx`, `stats-skeleton.tsx`). Five business files modified.

**Tech Stack:** React 19 + TanStack Router/Query + Tailwind 4 + @base-ui/react + zustand + vitest 4.1.10. Animation = pure CSS + Web Animations API only.

## Global Constraints

- No new third-party UI / animation libraries may be added to `web/package.json`.
- All async loading states render via `<Skeleton/>` primitive + per-page `<XxxSkeleton/>` — never `<p>加载中...</p>`.
- All mutation success / failure surfaces via `toast.success / toast.error` from `@/components/ui/toast`. Inline error states are allowed ONLY when they must stay adjacent to a form input (login form).
- `prefers-reduced-motion: reduce` MUST be honored: every keyframe MUST have a reduced-motion override; JS-driven rAF animations MUST consult `useReducedMotion()`.
- z-index layers: `--z-base: 0`, `--z-sticky: 20`, `--z-toast: 80`, `--z-dialog: 90`, `--z-modal: 100`.
- File-size caps: ui primitives ≤200, features ≤250, routes ≤300, stores/lib/hooks ≤200. ±20 lines reviewer override.
- Verification: `cd web && bunx tsc --noEmit` 0 errors, `vp check` 0 errors, `vp lint --type-aware -f agent` 0 warnings, manual browser F1-F10 + dark mode + 390px + reduced-motion.
- Lore commit per task.

---

## File Structure

**Create:**
- `web/src/features/practice/wrong-questions-skeleton.tsx` — `<WrongQuestionsSkeleton/>` (count badge placeholder + 3 expanded cards).
- `web/src/features/practice/stats-skeleton.tsx` — `<StatsSkeleton/>` (1 ring placeholder + 2 stat-card placeholders + chapter-stats card).

**Modify:**
- `web/src/features/practice/wrong-questions.tsx:1-15, 87-117` — replace `<p>加载中...</p>` with `<WrongQuestionsSkeleton/>`; replace inline empty-state SVG with `<EmptyIllustration name="empty-wrong" />`.
- `web/src/features/practice/stats.tsx:1-15, 100-178` — replace `<p>加载中...</p>` with `<StatsSkeleton/>`; wrap numeric displays in `<AnimatedNumber/>`.
- `web/src/features/settings/index.tsx:1-15, 25, 34-72, 86, 105` — drop `savedHint` state; `toast.success` on save + clear-cache; gate logout behind `<ConfirmDialog variant="destructive">`.
- `web/src/features/auth/index.tsx:1-15, 81-93, 95-109` — add `toast.error` on send-code / verify-login failures (inline error stays).
- `web/src/features/auth/brand-panel.tsx:7-7` — add `animate-fadeIn` to outer container.

**Imported from PR1 (consume, do not redefine):**
- `<Skeleton variant="text|rect|circle" />` from `@/components/ui/skeleton`
- `toast` from `@/components/ui/toast`
- `<AnimatedNumber value duration={400} />` from `@/components/ui/animated-number`
- `<ConfirmDialog />` from `@/components/ui/confirm-dialog`
- `<EmptyIllustration name="empty-questions"|"empty-wrong"|"empty-done" />` from `@/components/empty-state`
- `<EmptyState />` from `@/components/empty-state`
- `animate-fadeIn` utility (defined in `styles/index.css` @theme)

---

## Tasks

### Task 1: `<WrongQuestionsSkeleton />` co-located component

**Files:**
- Create: `web/src/features/practice/wrong-questions-skeleton.tsx`

- [ ] **Step 1: Implement**

```tsx
// web/src/features/practice/wrong-questions-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Mirrors the real WrongQuestionsPage layout: count badge placeholder
 * (mobile) + 3 collapsed cards stacked vertically. CLS = 0 because the
 * placeholder heights match the real Card + content.
 */
export function WrongQuestionsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" role="status" aria-label="加载错题列表">
      <div className="md:hidden">
        <Skeleton variant="rect" w={88} h={24} r={9999} />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton variant="rect" w={36} h={20} />
                <Skeleton variant="rect" w={72} h={20} />
                <Skeleton variant="text" w={92} />
              </div>
              <Skeleton variant="rect" w={48} h={28} />
            </div>
            <Skeleton variant="text" w="85%" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} variant="rect" w="100%" h={44} />
            ))}
            <div className="flex justify-end">
              <Skeleton variant="rect" w={72} h={32} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(practice): add WrongQuestionsSkeleton for layout parity" \
  --body "Co-located placeholder matching real Card + PageHero layout. Uses PR1 Skeleton primitive (variant text|rect, shimmer + reduced-motion handled by primitive)." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "visual CLS parity (manual F4 pending)"
```

---

### Task 2: wire WrongQuestionsSkeleton + EmptyIllustration

**Files:**
- Modify: `web/src/features/practice/wrong-questions.tsx:1-15, 87-89, 94-117`

- [ ] **Step 1: Update imports (line 1-15 block)**

Find the existing line `import { EmptyState } from '@/components/empty-state';` and replace with:

```tsx
import { EmptyState, EmptyIllustration } from '@/components/empty-state';
import { WrongQuestionsSkeleton } from './wrong-questions-skeleton';
```

(Remove any now-duplicate `EmptyState` import.)

- [ ] **Step 2: Replace loading branch (lines 87-89)**

```tsx
// from:
if (isLoading) {
  return <p className="text-muted-foreground">加载中...</p>;
}

// to:
if (isLoading) {
  return <WrongQuestionsSkeleton />;
}
```

- [ ] **Step 3: Replace empty-state `icon` prop (line ~98)**

```tsx
// from:
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M9 11l3 3L22 4" />
          </svg>
        }

// to:
        icon={<EmptyIllustration name="empty-wrong" />}
```

- [ ] **Step 4: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual F4: cold load → skeleton (no text); empty list → illustration inside muted slot; dark + 390px + reduced-motion all clean.

```
lore commit \
  --intent "feat(practice): wrong-questions uses skeleton + empty-illustration" \
  --body "Replaces inline '加载中...' with WrongQuestionsSkeleton; replaces inline SVG icon prop with EmptyIllustration name='empty-wrong' from PR1 primitive. Zero textual loading states remain." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F4 cold-load shows skeleton, empty shows illustration" \
  --not-tested "cross-browser Safari (Chromium manual only)"
```

---

### Task 3: `<StatsSkeleton />` co-located component

**Files:**
- Create: `web/src/features/practice/stats-skeleton.tsx`

- [ ] **Step 1: Implement**

```tsx
// web/src/features/practice/stats-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Mirror of the StatsPage layout: 96px ring + 2 stat tiles + 1 chapter
 * stats card. Equal-height to the resolved view (zero CLS).
 */
export function StatsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" role="status" aria-label="加载学习统计">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <Card className="flex items-center justify-center p-6">
          <Skeleton variant="circle" w={96} h={96} />
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <Skeleton variant="text" w={60} h={28} />
              <Skeleton variant="text" w={72} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <Skeleton variant="text" w={60} h={28} />
              <Skeleton variant="text" w={72} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton variant="text" w={160} h={18} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" w="60%" />
                <Skeleton variant="text" w={64} />
              </div>
              <Skeleton variant="rect" w="100%" h={8} r={9999} />
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
  --intent "feat(practice): add StatsSkeleton with ring + stat tiles + chapter card" \
  --body "Co-located skeleton matching StatsPage layout. CLS = 0 thanks to identical outer grid ratios." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "visual parity (manual F5 pending)"
```

---

### Task 4: wire StatsSkeleton + AnimatedNumber on stats page

**Files:**
- Modify: `web/src/features/practice/stats.tsx:1-15, 100-178`

- [ ] **Step 1: Update imports (lines 1-15)**

Merge into the existing `@/components` import block:

```tsx
import { StatsSkeleton } from './stats-skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
```

- [ ] **Step 2: Replace loading branch (lines 100-102)**

```tsx
// from:
if (isLoading) {
  return <p className="text-muted-foreground">加载中...</p>;
}

// to:
if (isLoading) {
  return <StatsSkeleton />;
}
```

- [ ] **Step 3: Wrap ring center pct (line ~84)**

In `AccuracyRing`, find the inner pct span:

```tsx
<span className="text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
```

Replace with:

```tsx
<span className="text-2xl font-bold tabular-nums text-foreground">
  <AnimatedNumber value={pct} duration={500} />%
</span>
```

- [ ] **Step 4: Wrap total_questions + correct_count (lines ~151, ~159)**

```tsx
// from:
<div className="text-2xl font-bold text-foreground sm:text-3xl">
  {stats.total_questions}
</div>

// to:
<div className="text-2xl font-bold text-foreground sm:text-3xl">
  <AnimatedNumber value={stats.total_questions} duration={500} />
</div>
```

```tsx
// from:
<div className="text-2xl font-bold text-success sm:text-3xl">
  {stats.correct_count}
</div>

// to:
<div className="text-2xl font-bold text-success sm:text-3xl">
  <AnimatedNumber value={stats.correct_count} duration={500} />
</div>
```

- [ ] **Step 5: Wrap per-chapter pct (line ~186)**

```tsx
// from:
<span className="ml-2 shrink-0 text-muted-foreground">
  {cs.correct_count}/{cs.total_questions} · {pct}%
</span>

// to:
<span className="ml-2 shrink-0 text-muted-foreground">
  {cs.correct_count}/{cs.total_questions} · <AnimatedNumber value={pct} duration={400} />%
</span>
```

- [ ] **Step 6: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual F5: cold-load `/stats` → skeleton → ring + tiles count up 0→target over 500ms; chapter rows fill top-down. Reduced-motion → snap instantly. Dark mode + 390px OK.

```
lore commit \
  --intent "feat(practice): stats page uses skeleton + animated numbers" \
  --body "Skeleton on loading; ring center pct, total_questions, correct_count, and per-chapter pct all rAF animate 0→target on first paint via PR1 AnimatedNumber. Reduced-motion + document.hidden + off-screen handled by the primitive." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F5 dark+390px+reduced-motion" \
  --not-tested "Safari mid-frame CSSVariable interpolation"
```

---

### Task 5: Settings — `savedHint` → `toast.success`, plus clear-cache feedback

**Files:**
- Modify: `web/src/features/settings/index.tsx:1-15, 25, 34-72, 86`

- [ ] **Step 1: Update imports**

Add:

```tsx
import { toast } from '@/components/ui/toast';
```

(merging with existing imports if any; the file currently has none from this path.)

- [ ] **Step 2: Drop `savedHint` state (line 25)**

Remove:

```tsx
const [savedHint, setSavedHint] = useState(false);
```

- [ ] **Step 3: Replace `handleSaveNickname` (lines 34-46)**

```tsx
const handleSaveNickname = useCallback(() => {
  if (!auth.user) return;
  const trimmed = nicknameDraft.trim();
  if (!trimmed || trimmed === auth.user.nickname) {
    return;
  }
  setUser({ ...auth.user, nickname: trimmed }, auth.token ?? '');
  toast.success('昵称已保存');
}, [auth, nicknameDraft, setUser]);
```

- [ ] **Step 4: Add toast.success at end of `handleClearCache` (lines 54-72)**

Find the last line of `handleClearCache` (the line `void queryClient.invalidateQueries();`) and add the toast after it:

```tsx
    void queryClient.invalidateQueries();
    toast.success('缓存已清空');
  }, [queryClient]);
```

- [ ] **Step 5: Remove the `savedHint` reference in Field description (line 86)**

```tsx
// from:
<Field label="昵称" description={savedHint ? '已保存' : '保存后立即生效'}>

// to:
<Field label="昵称" description="保存后立即生效">
```

- [ ] **Step 6: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/settings/index.tsx`
Expected: 0 errors / 0 warnings. File ≤ 250 lines.

Manual F8: type a new nickname → "保存" → toast.success at top-right (≥sm) / bottom-center (<640px) with text "昵称已保存". Click "清空缓存" → toast.success with "缓存已清空".

```
lore commit \
  --intent "feat(settings): replace savedHint setTimeout with toast.success" \
  --body "Drop savedHint state + 1800ms timer. Saving nickname and clearing cache both surface toast.success from PR1 primitive. Inline 'description' on the nickname Field is now static ('保存后立即生效')." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F8 dark+390px+reduced-motion" \
  --not-tested "concurrent save+logout race"
```

---

### Task 6: Settings — logout goes through `<ConfirmDialog variant="destructive">`

**Files:**
- Modify: `web/src/features/settings/index.tsx:1-15, 48-52, 105, end-of-file`

- [ ] **Step 1: Update imports**

Add:

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
```

- [ ] **Step 2: Add `logoutDialogOpen` state**

Right after the `nicknameDraft` state line:

```tsx
const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
```

- [ ] **Step 3: Update the "退出登录" button (line 105)**

```tsx
// from:
<Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
  <LogOut className="size-4" />
  退出登录
</Button>

// to:
<Button
  variant="destructive"
  onClick={() => setLogoutDialogOpen(true)}
  className="w-full sm:w-auto"
>
  <LogOut className="size-4" />
  退出登录
</Button>
```

- [ ] **Step 4: Add ConfirmDialog JSX just before the outer closing `</div>`**

```tsx
<ConfirmDialog
  open={logoutDialogOpen}
  onOpenChange={setLogoutDialogOpen}
  title="确认登出?"
  description="登出后将清空本地缓存,需要重新使用邮箱登录"
  confirmLabel="登出"
  cancelLabel="取消"
  variant="destructive"
  onConfirm={handleLogout}
/>
```

`handleLogout` itself (lines 48-52) stays unchanged — it still does `reset()` + `queryClient.clear()` + `navigate({ to: '/login' })`.

- [ ] **Step 5: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/settings/index.tsx`
Expected: 0 errors / 0 warnings. File ≤ 250 lines.

Manual F8: tap "退出登录" → modal opens (`z-dialog: 90`); confirm label is `登出` with `bg-destructive`; cancel returns without state change; confirm clears auth + navigates to `/login`.

```
lore commit \
  --intent "feat(settings): gate logout behind destructive ConfirmDialog" \
  --body "Replaces immediate reset+navigate with a ConfirmDialog (variant='destructive', confirmLabel='登出'). Toast viewport (z-toast:80) stays beneath dialog (z-dialog:90) so feedback still shows after dismissal." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F8 dark+390px" \
  --not-tested "Tab/Shift-Tab keyboard trap inside dialog (relies on @base-ui/react)"
```

---

### Task 7: Login — add `toast.error` on send-code / verify-login failures

**Files:**
- Modify: `web/src/features/auth/index.tsx:1-15, 81-93, 95-109`

- [ ] **Step 1: Update imports**

Add:

```tsx
import { toast } from '@/components/ui/toast';
```

(merging with existing imports if any; the file currently has none from this path.)

- [ ] **Step 2: Add `toast.error` inside `sendCode` catch (lines 81-93)**

```tsx
// from:
    } catch {
      setError('Failed to send code');
    } finally {
      setIsSendingCode(false);
    }

// to:
    } catch {
      setError('Failed to send code');
      toast.error('验证码发送失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
```

(Note: the existing inline banner literal is the English `'Failed to send code'`; the new toast message is a more user-friendly Chinese translation of the same error. The inline banner stays English (it is a developer-friendly debug string); the toast is the user-facing message.)

- [ ] **Step 3: Add `toast.error` inside `verifyLogin` catch (lines 95-109)**

```tsx
// from:
    } catch {
      setError('Invalid code');
    } finally {
      setIsVerifying(false);
    }

// to:
    } catch {
      setError('Invalid code');
      toast.error('验证码无效或已过期，请检查后重试');
    } finally {
      setIsVerifying(false);
    }
```

(Same rule: inline banner literal stays English, toast message is Chinese.)

- [ ] **Step 4: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual F1: at the login form, force a verify-login error (enter a wrong code) → inline red banner shows + `toast.error` slides in at the bottom (mobile) / top-right (desktop).

```
lore commit \
  --intent "feat(auth): surface toast.error on login send/verify failures" \
  --body "Inline red banner kept adjacent to the form (per spec §4.1 — required for accessibility), plus an additional toast.error with the same message. axios interceptor (PR1) fires its generic toast on non-401 HTTP failures; the per-call messages are the same string for the same code path." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F1" \
  --not-tested "interceptor double-fire under network error (relies on PR1)"
```

---

### Task 8: Brand-panel — entrance fadeIn

**Files:**
- Modify: `web/src/features/auth/brand-panel.tsx:7-7`

- [ ] **Step 1: Add `animate-fadeIn` to outer container**

```tsx
// from:
<div className="relative hidden h-full w-full overflow-hidden md:flex md:flex-col md:justify-between bg-gradient-to-br from-primary/95 via-primary to-primary/80 p-12 text-primary-foreground">

// to:
<div className="animate-fadeIn relative hidden h-full w-full overflow-hidden md:flex md:flex-col md:justify-between bg-gradient-to-br from-primary/95 via-primary to-primary/80 p-12 text-primary-foreground">
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

Manual F1: cold load `/login` on desktop → brand panel fades in over ~320ms once. `prefers-reduced-motion: reduce` → panel fully opaque from first paint. Mobile (`<768px`): brand panel is hidden (`md:flex`) — no impact.

```
lore commit \
  --intent "feat(auth): brand panel enters with fadeIn keyframe" \
  --body "Apply PR1's animate-fadeIn utility to the brand panel root. prefers-reduced-motion handled by the override in styles/index.css." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, manual F1 dark+390px+reduced-motion" \
  --directive "If animate-fadeIn is missing at apply time, the keyframe definition lives in styles/index.css @theme (PR1 Task 2)."
```

---

### Task 9: PR4 final verification

- [ ] **Step 1: Run all gates**

```bash
cd /Users/norman/workspace/zhimingcool/architect-prep/web
bunx tsc --noEmit
vp check
vp lint --type-aware -f agent
vp test run
```

Expected: 0 errors, 0 warnings, 12 PR1 tests still green (no new PR4 tests per spec §4.2).

- [ ] **Step 2: File-size cap audit**

```bash
cd /Users/norman/workspace/zhimingcool/architect-prep/web
wc -l src/features/practice/wrong-questions.tsx \
      src/features/practice/stats.tsx \
      src/features/settings/index.tsx \
      src/features/auth/index.tsx \
      src/features/auth/brand-panel.tsx \
      src/features/practice/wrong-questions-skeleton.tsx \
      src/features/practice/stats-skeleton.tsx
```

Expected: all ≤ 250 lines.

- [ ] **Step 3: Manual F1-F10 smoke**

Open `vp dev` and walk F1 (login), F2 (knowledge), F3 (practice), F4 (wrong-questions), F5 (stats), F6 (review), F7 (settings), F8 (logout via dialog), F9 (dark mode), F10 (mobile 390px). At each:
- No `加载中...` text in DOM (DevTools).
- Toast appears when expected (wrong code → toast.error; save nickname → toast.success; clear cache → toast.success).
- Skeleton renders during loading (wrong-questions, stats).
- ConfirmDialog opens (logout), keyboard escape works.
- Brand panel fades in on login.

- [ ] **Step 4: Final commit (only if any cleanup done)**

```
lore commit \
  --intent "chore(PR4): final verification + file-size audit + manual F1-F10 smoke" \
  --body "tsc 0, vp check 0, vp lint 0, 12 PR1 tests still green. All PR4 files ≤ 250 lines. F1-F10 manual smoke clean." \
  --scope-risk narrow --reversibility clean \
  --tested "all gates green + manual F1-F10" \
  --not-tested "load test (out of scope for UI PR)"
```

---

## Self-Review (executed before saving)

1. **Spec coverage:** Spec §4.1 mapping table row-by-row covered: settings `savedHint → toast.success` (Task 5), settings cache clear feedback (Task 5), settings `window.confirm` → `ConfirmDialog` (Task 6), login inline-keep + extra toast.error (Task 7), wrong-questions `加载中...` → skeleton (Tasks 1+2), stats `加载中...` → skeleton (Tasks 3+4), stats numeric dry values → animated number (Task 4), brand-panel subtle motion (Task 8). EmptyIllustration usage added in Task 2 for wrong-questions.
2. **No placeholders:** no "TBD" / "TODO" / "etc" / "similar to".
3. **Type consistency:** `toast.success` / `toast.error` stable; `WrongQuestionsSkeleton` / `StatsSkeleton` stable names; existing `<Card/>` / `<Button/>` / `<Badge/>` imports retained.
4. **Each step ≤5 minutes:** largest is Task 4 (5 sub-edits in stats.tsx) — all small.
5. **Each task ends with `lore commit`:** confirmed.
6. **File-size cap:** skeleton files ~35-45 LOC; settings grows by ~10 lines net (savedHint + setTimeout removed, toast.success ×2 + ConfirmDialog ×1 added) → still ~165 LOC. Auth `index.tsx` grows by 2 lines. Stats + wrong-questions drop a few lines.
7. **No new third-party libs:** no new package.json entries; only PR1 primitives consumed.

---

## Out of scope for PR4 (deferred)

- New unit tests for PR4 components (per spec §4.2 only PR1 has vitest; PR4 verification = lint + manual browser).
- Refactoring `stats.tsx` < 250 lines (currently 198; still OK after edits).
- Refactoring `wrong-questions.tsx` < 250 lines (currently 250; after edits, still ~245).
- Refactoring `auth/index.tsx` (currently 199; will grow to ~201 after Task 7).
- New /knowledge /review specific changes (those are PR3; PR4 touches only the 4 listed surfaces).

---

## Post-PR4 verification

1. `cd web && bunx tsc --noEmit` → 0 errors
2. `cd web && vp check` → 0 errors
3. `cd web && vp lint --type-aware -f agent` → 0 warnings
4. `cd web && vp test run` → 12 PR1 tests still green (no new tests)
5. Manual F1-F10: no `加载中...` text appears, toast works, ConfirmDialog opens, dark mode + 390px + reduced-motion all clean, brand panel fades in
6. File-size audit: all PR4 files ≤ 250 lines
