import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReviewItem } from './types';

const RATING_LABELS: Record<1 | 2 | 3 | 4, { label: string; hint: string }> = {
  1: { label: '重答', hint: '完全忘记' },
  2: { label: '困难', hint: '犹豫 / 答错' },
  3: { label: '良好', hint: '正确但有迟疑' },
  4: { label: '简单', hint: '轻松答对' },
};

function ratingVariant(r: 1 | 2 | 3 | 4): 'destructive' | 'outline' | 'secondary' | 'primary' {
  // 1 red, 2 amber-outline, 3 default, 4 primary — matches FSRS UI convention.
  switch (r) {
    case 1:
      return 'destructive';
    case 2:
      return 'outline';
    case 3:
      return 'secondary';
    case 4:
      return 'primary';
  }
}

// ─── Review card ───────────────────────────────────────────────────────
// The whole card is a toggle button: click or Enter/Space reveals the back,
// then the four rating buttons unlock (F17). Rating buttons are siblings of
// the card, not children, so no nested interactive elements are created.
// ────────────────────────────────────────────────────────────────────────

export interface ReviewCardViewProps {
  item: ReviewItem;
  leaving: boolean;
  locked: boolean;
  onGrade: (rating: 1 | 2 | 3 | 4) => void;
}

export function ReviewCardView({ item, leaving, locked, onGrade }: ReviewCardViewProps) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip on each new card (parent's `key={item.id}` does the heavy
  // lifting, but defensive in case).
  useEffect(() => {
    setFlipped(false);
  }, [item.id]);

  const isWrong = item.item_type === 'wrong_question';

  function toggleFlipped() {
    setFlipped((value) => !value);
  }

  return (
    <div
      className={cn(
        'mx-auto flex max-w-2xl flex-col gap-4 animate-fadeIn transition-opacity duration-200',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="info">{isWrong ? '错题' : '知识卡'}</Badge>
          {!isWrong && item.card_source && (
            <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
              复习来源: {item.card_source}
            </span>
          )}
        </div>
        <span>到期: {new Date(item.due).toLocaleString('zh-CN')}</span>
      </div>

      <Card
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? '隐藏答案' : '查看答案'}
        onClick={toggleFlipped}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleFlipped();
          }
        }}
        className={cn(
          'min-h-[240px] cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
          {!flipped ? (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                问题 · 点击或按回车查看答案
              </p>
              <p className="text-lg font-medium leading-relaxed text-foreground">
                {isWrong
                  ? (item.question_content ?? '题目内容缺失')
                  : (item.card_front ?? '卡片正面缺失')}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">答案</p>
              <p className="text-base leading-relaxed text-foreground">
                {isWrong ? '请回顾错题解析（点击切回题目）' : (item.card_back ?? '卡片背面缺失')}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rating buttons: mobile = 2x2 grid, desktop = 1x4. min-h-[56px] keeps
          every FSRS rating tappable on 390px phones. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([1, 2, 3, 4] as const).map((r) => (
          <Button
            key={r}
            variant={ratingVariant(r)}
            size="lg"
            disabled={locked || !flipped}
            onClick={() => onGrade(r)}
            className="flex min-h-[56px] flex-col gap-0.5 px-2 py-2"
          >
            <span className="text-sm font-semibold">{RATING_LABELS[r].label}</span>
            <span className="text-[10px] font-normal opacity-80">{RATING_LABELS[r].hint}</span>
          </Button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="text-center text-xs text-muted-foreground">
        {locked
          ? '正在提交评分...'
          : flipped
            ? '选择一个评分提交'
            : '点击卡片或按回车查看答案后即可评分'}
      </p>
    </div>
  );
}

// ─── Today metrics strip ───────────────────────────────────────────────
// Compact 2x2 grid on mobile (~120px), one strip ≥sm. Today-only indicators;
// `total_items` is a cumulative value and deliberately not surfaced here.
// ────────────────────────────────────────────────────────────────────────

export interface ReviewMetrics {
  due: number | undefined;
  reviewed: number | undefined;
  progressPct: number;
  positionLabel: string;
}

export function ReviewMetricsStrip({ metrics }: { metrics: ReviewMetrics }) {
  return (
    <section aria-label="今日复习指标" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metric label="今日到期" value={metrics.due} accent="text-primary" />
      <Metric label="今日已复习" value={metrics.reviewed} accent="text-success" />
      <Metric label="队列位置" value={metrics.positionLabel} accent="text-foreground" />
      <Metric label="今日进度" value={`${metrics.progressPct}%`} accent="text-primary">
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${metrics.progressPct}%` }}
          />
        </div>
      </Metric>
    </section>
  );
}

interface MetricProps {
  label: string;
  value: number | string | undefined;
  accent: string;
  children?: ReactNode;
}

function Metric({ label, value, accent, children }: MetricProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-1.5">
      <span className={cn('block text-lg font-bold leading-none tabular-nums', accent)}>
        {value ?? '—'}
      </span>
      {children}
      <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{label}</span>
    </div>
  );
}
