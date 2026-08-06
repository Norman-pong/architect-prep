# UI/UX Upgrade — PR3: Knowledge / Practice / Review Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Knowledge, Practice, and Review pages up to the new standard — per-page skeletons replace inline `加载中...` text, empty states use `<EmptyIllustration/>`, and the 388-line `quiz.tsx` is split into a coordinator + two presentational siblings.

**Architecture:** Five new files (3 per-page skeletons + 2 extracted quiz sub-components). Four existing files modified (`quiz.tsx` + `mobile-outline.tsx` + `desktop-outline.tsx` + `review-page.tsx`). No new primitives — every primitive is imported from PR1.

**Tech Stack:** React 19 + TanStack Router/Query + Tailwind 4 + @base-ui/react + zustand + vitest 4.1.10. Animation = pure CSS (shimmer via `animate-shimmer`, fadeIn via `animate-fadeIn` from PR1's index.css) + Web Animations API.

## Global Constraints

- No new third-party UI / animation libraries may be added to `web/package.json`.
- All async loading states render via `<Skeleton/>` primitive + per-page `<XxxSkeleton/>` — never `<p>加载中...</p>`.
- All mutation success / failure surfaces via `toast.success / toast.error` from `@/components/ui/toast`.
- `prefers-reduced-motion: reduce` MUST be honored: every keyframe MUST have a reduced-motion override.
- z-index layers: `--z-base: 0`, `--z-sticky: 20`, `--z-toast: 80`, `--z-dialog: 90`, `--z-modal: 100`.
- File-size caps: ui primitives ≤200, features ≤250, routes ≤300, stores/lib/hooks ≤200. ±20 lines reviewer override.
- Verification: `cd web && bunx tsc --noEmit` 0 errors, `vp check` 0 errors, `vp lint --type-aware -f agent` 0 warnings, manual browser F1-F10 + dark mode + 390px + reduced-motion.
- Lore commit per task.

---

## File Structure

**Create:**
- `web/src/features/knowledge/knowledge-skeleton.tsx` — `<KnowledgeOutlineSkeleton variant="mobile"|"desktop" rows={12} />` (matches MobileOutline / DesktopOutline row layout).
- `web/src/features/practice/quiz-skeleton.tsx` — `<QuizSkeleton />` (PageHero + question card + 4 options + submit).
- `web/src/features/review/review-skeleton.tsx` — `<ReviewCardSkeleton />` (3 stat cards + 240px card + 4 rating buttons).
- `web/src/features/practice/quiz-option.tsx` — `<QuizOption letterKey label isSelected isCorrect isWrongSelected showResult disabled onToggle />` presentational.
- `web/src/features/practice/quiz-result.tsx` — `<QuizResult result: SubmitResponse />` post-submit explanation card.

**Modify:**
- `web/src/features/practice/quiz.tsx` (388 → ≤200) — import & wire the 3 new components; replace loading text + empty inline SVG.
- `web/src/features/review/review-page.tsx:67-69, 102-103, 146-151` — wire `ReviewCardSkeleton` + `EmptyIllustration` + `animate-fadeIn`.
- `web/src/features/knowledge/mobile-outline.tsx:1-5, 24-39` — wire `KnowledgeOutlineSkeleton variant="mobile"` + `EmptyIllustration`.
- `web/src/features/knowledge/desktop-outline.tsx:1-6, 60-77` — wire `KnowledgeOutlineSkeleton variant="desktop"` + `EmptyIllustration`.

**Imported from PR1 / PR2 (consume, do not redefine):**
- `<Skeleton variant="text|rect|circle" />` from `@/components/ui/skeleton`
- `<EmptyIllustration name="empty-questions"|"empty-wrong"|"empty-done" />` from `@/components/empty-state`
- `<EmptyState />` from `@/components/empty-state`
- `animate-fadeIn` / `animate-shimmer` from PR1 `styles/index.css`

---

## Tasks

### Task 1: `<KnowledgeOutlineSkeleton />` primitive

**Files:**
- Create: `web/src/features/knowledge/knowledge-skeleton.tsx`

**Interfaces:**
- Consumes: `<Skeleton />` from PR1.
- Produces: `<KnowledgeOutlineSkeleton variant?: 'mobile' | 'desktop'; rows?: number />`.

- [ ] **Step 1: Implement**

```tsx
// web/src/features/knowledge/knowledge-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

interface KnowledgeOutlineSkeletonProps {
  /** mobile: 12 flat rows. desktop: 12 expanded-card placeholders + toolbar row. */
  variant?: 'mobile' | 'desktop';
  /** Number of placeholder rows. Defaults to 12 to match the typical chapter count. */
  rows?: number;
}

/**
 * Mirrors the real <MobileOutline /> / <DesktopOutline /> layout while
 * chapters load. Equal-height to the resolved view (zero CLS). Shimmer
 * comes from PR1's <Skeleton/> primitive.
 */
export function KnowledgeOutlineSkeleton({
  variant = 'mobile',
  rows = 12,
}: KnowledgeOutlineSkeletonProps) {
  if (variant === 'desktop') {
    return (
      <div
        className="space-y-4 animate-fadeIn"
        role="status"
        aria-label="加载章节目录中"
        aria-busy="true"
      >
        <div className="flex items-center justify-end gap-2">
          <Skeleton variant="rect" w={64} h={28} r={6} />
          <Skeleton variant="rect" w={64} h={28} r={6} />
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" w={40} h={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" w="60%" />
                  <Skeleton variant="rect" w={96} h={6} r={9999} />
                </div>
                <Skeleton variant="rect" w={20} h={20} r={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-border animate-fadeIn"
      role="status"
      aria-label="加载章节目录中"
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-[56px] items-center gap-3 px-3 py-3">
          <Skeleton variant="circle" w={40} h={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" w="40%" />
            <Skeleton variant="text" w="80%" h={12} />
          </div>
          <Skeleton variant="rect" w={40} h={14} r={4} />
        </div>
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
  --intent "feat(knowledge): add KnowledgeOutlineSkeleton (mobile + desktop variants)" \
  --body "Per-page skeleton matching MobileOutline / DesktopOutline row layout. Uses PR1 Skeleton + animate-fadeIn. 12 rows default; pass rows={n} to override." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual CLS check 390px + 1440px, reduced-motion fallback"
```

---

### Task 2: `<QuizSkeleton />` primitive

**Files:**
- Create: `web/src/features/practice/quiz-skeleton.tsx`

- [ ] **Step 1: Implement**

```tsx
// web/src/features/practice/quiz-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page-level loading state for /practice. Equal-height to the resolved
 * view (PageHero + question card + 4 options + submit button).
 */
export function QuizSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      role="status"
      aria-label="加载题目中"
      aria-busy="true"
    >
      {/* Mobile-only progress badge band */}
      <div className="md:hidden flex h-9 items-center justify-end gap-2 px-3 py-2">
        <Skeleton variant="rect" w={72} h={20} r={9999} />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton variant="rect" w={56} h={20} r={9999} />
          <Skeleton variant="rect" w={72} h={20} r={9999} />
          <Skeleton variant="rect" w={68} h={20} r={9999} className="ml-auto" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" w="85%" />
          <Skeleton variant="text" w="60%" />
        </div>
        <div className="mt-4 space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map((key) => (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Skeleton variant="rect" w={28} h={28} r={6} />
              <Skeleton variant="text" className="flex-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Skeleton variant="rect" w={96} h={40} r={6} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/practice/quiz-skeleton.tsx`
Expected: 0 errors / 0 warnings. File ≤ 60 lines.

```
lore commit \
  --intent "feat(practice): add QuizSkeleton (PageHero + question card + 4 options + submit)" \
  --body "Equal-height placeholder for /practice. Uses PR1 Skeleton + animate-fadeIn." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 50" \
  --not-tested "manual CLS check"
```

---

### Task 3: `<ReviewCardSkeleton />` primitive

**Files:**
- Create: `web/src/features/review/review-skeleton.tsx`

- [ ] **Step 1: Implement**

```tsx
// web/src/features/review/review-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page-level loading state for /review. Equal-height to the resolved view
 * (3 stat cards + 240px review card + 2x4 rating buttons).
 */
export function ReviewCardSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      role="status"
      aria-label="加载复习卡中"
      aria-busy="true"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <Skeleton variant="text" w={64} h={30} className="block" />
            <Skeleton variant="text" w={88} h={14} className="mt-3 block" />
          </div>
        ))}
      </section>

      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="rect" w={48} h={20} r={9999} />
          <Skeleton variant="rect" w={120} h={16} r={4} />
        </div>
        <Skeleton variant="text" w={140} h={12} />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <Skeleton variant="text" w={120} h={12} />
            <Skeleton variant="text" w="80%" />
            <Skeleton variant="text" w="60%" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" h={56} r={6} />
          ))}
        </div>
        <Skeleton variant="text" w={140} h={12} className="mx-auto" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/review/review-skeleton.tsx`
Expected: 0 errors / 0 warnings. File ≤ 60 lines.

```
lore commit \
  --intent "feat(review): add ReviewCardSkeleton" \
  --body "Equal-height placeholder for /review. Uses PR1 Skeleton + animate-fadeIn." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 60" \
  --not-tested "manual CLS check"
```

---

### Task 4: `<QuizOption />` extracted component

**Files:**
- Create: `web/src/features/practice/quiz-option.tsx`

- [ ] **Step 1: Implement**

```tsx
// web/src/features/practice/quiz-option.tsx
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuizOptionProps {
  /** A/B/C/D letter shown in the left pill. */
  letterKey: string;
  /** Full option text. */
  label: string;
  /** Selected by the user (pre-submit). */
  isSelected: boolean;
  /** After submit: this option is one of `correct_answer_keys`. */
  isCorrect: boolean;
  /** After submit: user selected this option but it's wrong. */
  isWrongSelected: boolean;
  /** After submit: full result is rendered (drives color states). */
  showResult: boolean;
  /** Disabled (e.g. after submit). */
  disabled: boolean;
  /** Toggle handler — receives the option's letter key. */
  onToggle: (letterKey: string) => void;
}

/**
 * One answer choice in the quiz. Pre-submit behaves like a toggle/radio;
 * post-submit renders success / failure / neutral visual states.
 */
export function QuizOption({
  letterKey,
  label,
  isSelected,
  isCorrect,
  isWrongSelected,
  showResult,
  disabled,
  onToggle,
}: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(letterKey)}
      disabled={disabled}
      data-state={
        showResult
          ? isCorrect
            ? 'correct'
            : isWrongSelected
              ? 'wrong'
              : isSelected ? 'selected' : 'neutral'
          : isSelected ? 'selected' : 'idle'
      }
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-200',
        'hover:scale-[1.005] hover:shadow-sm active:scale-[0.998]',
        showResult && isCorrect && 'border-success bg-success/15 text-success shadow-sm',
        showResult && isWrongSelected && 'border-destructive bg-destructive/15 text-destructive shadow-sm',
        !showResult && isSelected && 'border-primary bg-primary/10 shadow-sm',
        !showResult && !isSelected && 'border-border hover:border-primary/40 hover:bg-primary/5',
        showResult && !isCorrect && !isWrongSelected && 'border-border opacity-60',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors',
          showResult && isCorrect && 'border-success bg-success text-success-foreground',
          showResult && isWrongSelected && 'border-destructive bg-destructive text-destructive-foreground',
          !showResult && isSelected && 'border-primary bg-primary text-primary-foreground',
          !showResult && !isSelected && 'border-border bg-background text-muted-foreground',
        )}
      >
        {showResult && isCorrect ? (
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        ) : showResult && isWrongSelected ? (
          <X className="size-3.5" strokeWidth={3} aria-hidden />
        ) : (
          letterKey
        )}
      </span>
      <span className="flex-1 font-medium">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/practice/quiz-option.tsx`
Expected: 0 errors / 0 warnings. File ≤ 120 lines.

```
lore commit \
  --intent "refactor(practice): extract QuizOption from quiz.tsx" \
  --body "Pure presentational component for one answer choice. 4 pre-submit + 5 post-submit visual states. Replaces inline SVGs with lucide-react Check/X icons. data-state attribute for future e2e selectors." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 90" \
  --not-tested "visual diff vs old inline rendering (consumer verify in Task 6)"
```

---

### Task 5: `<QuizResult />` extracted component

**Files:**
- Create: `web/src/features/practice/quiz-result.tsx`

- [ ] **Step 1: Implement**

```tsx
// web/src/features/practice/quiz-result.tsx
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubmitResponse } from './types';

export interface QuizResultProps {
  /** The submit response from /practice/submit. */
  result: SubmitResponse;
}

/**
 * Post-submit explanation card. Shown below the question card after the user
 * submits an answer; surfaces correct_answer_keys + explanation text.
 */
export function QuizResult({ result }: QuizResultProps) {
  const accentClass = result.is_correct
    ? 'border-success/30 bg-success/5'
    : 'border-destructive/30 bg-destructive/5';

  const pillBg = result.is_correct
    ? 'bg-success text-success-foreground'
    : 'bg-destructive text-destructive-foreground';

  const badgeVariant = result.is_correct ? 'success' : 'destructive';

  return (
    <Card className={cn('border-2 animate-fadeIn', accentClass)}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', pillBg)}>
            {result.is_correct ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            ) : (
              <X className="size-3.5" strokeWidth={3} aria-hidden />
            )}
          </span>
          <Badge variant={badgeVariant}>{result.is_correct ? '回答正确' : '回答错误'}</Badge>
          <span className="text-muted-foreground">正确答案:</span>
          <span className="font-semibold text-foreground">
            {result.correct_answer_keys.join(', ')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            解析
          </p>
          <p className="text-sm leading-relaxed text-foreground">{result.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/practice/quiz-result.tsx`
Expected: 0 errors / 0 warnings. File ≤ 100 lines.

```
lore commit \
  --intent "refactor(practice): extract QuizResult from quiz.tsx" \
  --body "Post-submit explanation card. Replaces inline SVGs with lucide Check/X icons. Adds animate-fadeIn entry. Border + background follow is_correct branch." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 70" \
  --not-tested "visual diff vs old inline rendering (consumer verify in Task 6)"
```

---

### Task 6: Wire `quiz.tsx` to extracted components

**Files:**
- Modify: `web/src/features/practice/quiz.tsx` (388 → ≤200, full rewrite)

- [ ] **Step 1: Replace the file body**

Overwrite `web/src/features/practice/quiz.tsx` with:

```tsx
// web/src/features/practice/quiz.tsx
import { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { EmptyIllustration } from '@/components/empty-state';
import { PageHero } from '@/components/layout/page-hero';
import { useSetHeader } from '@/components/layout/header-context';
import { QuizSkeleton } from './quiz-skeleton';
import { QuizOption } from './quiz-option';
import { QuizResult } from './quiz-result';
import type { Question, PaginatedResponse, SubmitResponse } from './types';

export function PracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const queryClient = useQueryClient();
  const search = useSearch({ from: '/_authenticated/practice/' });
  const chapterFilter = search.chapter;

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOptions(new Set());
    setSubmitResult(null);
  }, [chapterFilter]);

  const { data: questionList, isLoading } = useQuery({
    queryKey: ['practice-questions', chapterFilter],
    queryFn: async () => {
      const resp = await api.get('/practice/questions', {
        params: { chapter_id: chapterFilter ?? undefined, page: 1, page_size: 100 },
      });
      return resp.data.data as PaginatedResponse<Question>;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as SubmitResponse;
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      void queryClient.invalidateQueries({ queryKey: ['practice-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['wrong-questions'] });
    },
  });

  const questions = questionList?.items ?? [];
  const currentQuestion = questions[currentIndex];
  const isMultiple = currentQuestion?.question_type === 'multiple';

  const progressBadge = (
    <Badge variant="info" className="px-3 py-1 text-sm">
      {currentIndex + 1} / {questions.length}
    </Badge>
  );
  useSetHeader({
    title: '刷题练习',
    subtitle: '单选/多选,每题 1 个正确答案',
  });

  function toggleOption(key: string) {
    if (submitResult) return;
    const next = new Set(selectedOptions);
    if (isMultiple) {
      if (next.has(key)) next.delete(key);
      else next.add(key);
    } else {
      next.clear();
      next.add(key);
    }
    setSelectedOptions(next);
  }

  function handleSubmit() {
    if (!currentQuestion || selectedOptions.size === 0) return;
    submitMutation.mutate({
      question_id: currentQuestion.id,
      answer_keys: Array.from(selectedOptions).sort(),
    });
  }

  function handleNext() {
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex(currentIndex + 1);
    setSelectedOptions(new Set());
    setSubmitResult(null);
  }

  if (isLoading) return <QuizSkeleton />;

  if (!currentQuestion) {
    return (
      <EmptyState
        icon={<EmptyIllustration name="empty-questions" />}
        title="暂无题目"
        description="题库还没有题目,先去添加题目或等待管理员补充题库"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHero>{progressBadge}</PageHero>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {isMultiple ? (
              <Badge variant="warning" className="gap-1">
                <span className="inline-block size-2 rounded-sm border-2 border-current" aria-hidden />
                多选
              </Badge>
            ) : (
              <Badge variant="info" className="gap-1">
                <span className="inline-block size-2 rounded-full border-2 border-current" aria-hidden />
                单选
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              难度 {currentQuestion.difficulty}
            </Badge>
            <span className="ml-auto hidden md:inline-flex">{progressBadge}</span>
          </div>
          <CardTitle className="mt-2 text-base leading-relaxed">
            {currentQuestion.content}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(currentQuestion.options ?? []).map((opt) => {
            const key = opt.charAt(0);
            const isSelected = selectedOptions.has(key);
            const isCorrect = submitResult?.correct_answer_keys.includes(key) ?? false;
            const isWrongSelected = !!submitResult && isSelected && !isCorrect;
            return (
              <QuizOption
                key={opt}
                letterKey={key}
                label={opt}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isWrongSelected={isWrongSelected}
                showResult={!!submitResult}
                disabled={!!submitResult}
                onToggle={toggleOption}
              />
            );
          })}
        </CardContent>
      </Card>

      {submitResult && <QuizResult result={submitResult} />}

      <div className="flex justify-end gap-2">
        {!submitResult ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0 || submitMutation.isPending}
          >
            {submitMutation.isPending ? '提交中...' : '提交答案'}
          </Button>
        ) : (
          currentIndex < questions.length - 1 && (
            <Button variant="outline" onClick={handleNext}>
              下一题
            </Button>
          )
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/practice/quiz.tsx`
Expected: 0 errors / 0 warnings. File ≤ 200 lines.

```
lore commit \
  --intent "refactor(practice): wire quiz.tsx to QuizOption + QuizResult + QuizSkeleton" \
  --body "388→≤200 lines. Same useSetHeader, same submit/next logic, same isMultiple handling. Replaces inline option button + result card + loading text + empty SVG with extracted sub-components." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 175" \
  --not-tested "manual F1-F10 browser walk"
```

---

### Task 7: Wire `review-page.tsx`

**Files:**
- Modify: `web/src/features/review/review-page.tsx:1-11, 67-69, 102-103, 146-151`

- [ ] **Step 1: Update imports (lines 1-11)**

Merge into the existing import block:

```tsx
import { ReviewCardSkeleton } from './review-skeleton';
import { EmptyIllustration } from '@/components/empty-state';
```

- [ ] **Step 2: Replace loading fallback (lines 67-69)**

```tsx
// from:
if (statsLoading && queueLoading) {
  return <p className="text-muted-foreground">加载中...</p>;
}

// to:
if (statsLoading && queueLoading) {
  return <ReviewCardSkeleton />;
}
```

- [ ] **Step 3: Replace empty state (lines 102-103)**

```tsx
// from:
{!current || !hasMore ? (
  <EmptyState title="今日复习已完成" description="所有到期卡片都复习完毕，明天继续加油。" />
) : (

// to:
{!current || !hasMore ? (
  <EmptyState
    icon={<EmptyIllustration name="empty-done" />}
    title="今日复习已完成"
    description="所有到期卡片都复习完毕，明天继续加油。"
  />
) : (
```

- [ ] **Step 4: Add `animate-fadeIn` to ReviewCardView wrapper (lines 146-151)**

```tsx
// from:
<div
  className={cn(
    'mx-auto flex max-w-2xl flex-col gap-4 transition-opacity duration-200',
    leaving ? 'opacity-0' : 'opacity-100',
  )}
>

// to:
<div
  className={cn(
    'mx-auto flex max-w-2xl flex-col gap-4 animate-fadeIn transition-opacity duration-200',
    leaving ? 'opacity-0' : 'opacity-100',
  )}
>
```

- [ ] **Step 5: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent && wc -l src/features/review/review-page.tsx`
Expected: 0 errors / 0 warnings. File ≤ 250 lines.

```
lore commit \
  --intent "feat(review): wire ReviewCardSkeleton + EmptyIllustration" \
  --body "Replaces <p>加载中...</p> with <ReviewCardSkeleton/>; inline empty state with <EmptyIllustration name=\"empty-done\"/>. Adds animate-fadeIn entry. No behavior change — same fade-out on grade, same 220ms setTimeout, same useSetHeader." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0, wc -l ~= 250" \
  --not-tested "manual F6 browser walk (loading → first card, grade #1-4, card flip, migrate, completed)"
```

---

### Task 8: Wire `mobile-outline.tsx`

**Files:**
- Modify: `web/src/features/knowledge/mobile-outline.tsx:1-5, 24-39`

- [ ] **Step 1: Update imports**

Append to the existing import block:

```tsx
import { EmptyState } from '@/components/empty-state';
import { EmptyIllustration } from '@/components/empty-state';
import { KnowledgeOutlineSkeleton } from './knowledge-skeleton';
```

- [ ] **Step 2: Replace loading block**

```tsx
// from:
if (isLoading) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

// to:
if (isLoading) {
  return <KnowledgeOutlineSkeleton variant="mobile" />;
}
```

- [ ] **Step 3: Replace empty block**

```tsx
// from:
if (!chapters || chapters.length === 0) {
  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground">还没有章节。运行 seed 脚本导入数据。</p>
    </div>
  );
}

// to:
if (!chapters || chapters.length === 0) {
  return (
    <EmptyState
      icon={<EmptyIllustration name="empty-questions" />}
      title="还没有章节"
      description="运行 seed 脚本导入数据,即可看到章节列表。"
    />
  );
}
```

- [ ] **Step 4: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(knowledge): wire MobileOutline to skeleton + empty illustration" \
  --body "Replaces 8-row inline animate-pulse block with <KnowledgeOutlineSkeleton variant=\"mobile\"/>. Replaces inline <p>还没有章节…</p> with <EmptyState/> + <EmptyIllustration name=\"empty-questions\"/>." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual F2 mobile (loading → first chapter, empty chapters list, FAB continue)"
```

---

### Task 9: Wire `desktop-outline.tsx`

**Files:**
- Modify: `web/src/features/knowledge/desktop-outline.tsx:1-6, 60-77`

- [ ] **Step 1: Update imports**

Append:

```tsx
import { EmptyState } from '@/components/empty-state';
import { EmptyIllustration } from '@/components/empty-state';
import { KnowledgeOutlineSkeleton } from './knowledge-skeleton';
```

- [ ] **Step 2: Replace loading block**

```tsx
// from:
if (isLoading) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

// to:
if (isLoading) {
  return <KnowledgeOutlineSkeleton variant="desktop" />;
}
```

- [ ] **Step 3: Replace empty block**

```tsx
// from:
if (!chapters || chapters.length === 0) {
  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground">还没有章节。运行 seed 脚本导入数据。</p>
    </div>
  );
}

// to:
if (!chapters || chapters.length === 0) {
  return (
    <EmptyState
      icon={<EmptyIllustration name="empty-questions" />}
      title="还没有章节"
      description="运行 seed 脚本导入数据,即可看到章节列表。"
    />
  );
}
```

- [ ] **Step 4: Verify + commit**

Run: `cd web && bunx tsc --noEmit && vp check && vp lint --type-aware -f agent`
Expected: 0 errors / 0 warnings.

```
lore commit \
  --intent "feat(knowledge): wire DesktopOutline to skeleton + empty illustration" \
  --body "Same pattern as MobileOutline — uses desktop variant (toolbar + 12 expanded-card placeholders). Empty state matches MobileOutline for visual consistency." \
  --scope-risk narrow --reversibility clean \
  --tested "tsc 0, vp check 0, vp lint -f agent 0" \
  --not-tested "manual F2 desktop (loading → first chapter, expand-all, point click)"
```

---

## Self-Review (executed before saving)

1. **Spec coverage:** PR3 items from spec §1.1 (knowledge route via outline children; practice route via quiz.tsx; quiz split into 3 files; review-page polish) — covered in Tasks 1-9. Per-page skeletons from spec §3.2 (`KnowledgeOutlineSkeleton`, `QuizSkeleton`, `ReviewCardSkeleton`) — Tasks 1, 2, 3. EmptyIllustration usage from spec §2.1.5 — Tasks 6, 7, 8, 9.
2. **No placeholders:** no "TBD" / "TODO" / "etc" / "similar to".
3. **Type consistency:** `<KnowledgeOutlineSkeleton variant rows>` consistent across Tasks 1, 8, 9. `<QuizOption letterKey label isSelected isCorrect isWrongSelected showResult disabled onToggle>` consistent across Tasks 4, 6. `<QuizResult result>` consistent across Tasks 5, 6. `<EmptyIllustration name="...">` consistent across Tasks 6, 7, 8, 9.
4. **Each step ≤5 minutes:** every step is one focused action.
5. **Each task ends with `lore commit`:** confirmed (9 tasks → 9 commits).
6. **File-size cap audit:** quiz.tsx 388→175; quiz-option.tsx ~90; quiz-result.tsx ~70; quiz-skeleton.tsx ~50; review-skeleton.tsx ~60; knowledge-skeleton.tsx ~55; all under 250.

---

## Out of scope for PR3 (deferred)

- `web/src/routes/_authenticated/knowledge/index.tsx` file-size reduction (374 lines; >300 soft cap). The route file's media query + `validateSearch` helpers can be extracted in a future PR.
- `search-sheet.tsx` and `chapter-drawer.tsx` skeleton integration (not in PR3 scope per spec §1.1).
- PR4 surfaces (wrong-questions, stats, settings, login) — separate PR.
- PR2 Dashboard redo — separate PR.
- New unit tests for PR3 components (visual placeholders + presentational extraction; verification = lint + manual browser, per spec §4.2 which only mandates PR1 vitest).

---

## Post-PR3 verification

1. `cd web && bunx tsc --noEmit` → 0 errors
2. `cd web && vp check` → 0 errors
3. `cd web && vp lint --type-aware -f agent` → 0 warnings
4. `cd web && vp test run` → 12 PR1 tests still green (no new PR3 tests)
5. Manual F1-F10:
   - `/knowledge` mobile: outline loads → chapter row tap → reader view → mark mastered → next/prev
   - `/knowledge` desktop: outline loads → expand chapter → point click → reader view → mark mastered
   - `/knowledge` empty state: both mobile + desktop render `EmptyIllustration name="empty-questions"`
   - `/practice` load → single-choice submit wrong → submit correct → multi-choice next → empty state
   - `/review` load → flip card → grade #1 #2 #3 #4 → fade transition → empty state when done
6. Dark mode: skeletons use `bg-muted/60`, contrast OK; empty illustration inherits `currentColor`
7. 390px viewport: rating buttons 2x2, chapter rows readable, quiz options full-width
8. DevTools Rendering → "Emulate CSS prefers-reduced-motion: reduce": skeletons stay static
