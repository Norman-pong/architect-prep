import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { useReviewDue, useReviewGrade, useReviewMigrate, useReviewStats } from './queries';
import type { ReviewItem } from './types';

// ─── Visual states ─────────────────────────────────────────────────────
// A single card sits at the top of the page. Fading-out cards stay in
// the DOM until the queue refetches so the opacity transition runs.
// ────────────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<1 | 2 | 3 | 4, { label: string; hint: string }> = {
  1: { label: '重答', hint: '完全忘记' },
  2: { label: '困难', hint: '犹豫 / 答错' },
  3: { label: '良好', hint: '正确但有迟疑' },
  4: { label: '简单', hint: '轻松答对' },
};

export function ReviewPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useReviewStats();
  const { data: queue, isLoading: queueLoading, refetch } = useReviewDue();
  const grade = useReviewGrade();
  const migrate = useReviewMigrate();

  // Index of the card currently in view; advances after fade-out completes.
  const [index, setIndex] = useState(0);
  // Track whether the visible card is mid-fade so we can apply opacity.
  const [leavingId, setLeavingId] = useState<number | null>(null);

  const items = useMemo<ReviewItem[]>(() => queue?.items ?? [], [queue?.items]);
  const current: ReviewItem | undefined = items[index];
  const hasMore = index < items.length;

  // Reset cursor when a fresh queue arrives (e.g. after refetch).
  useEffect(() => {
    setIndex(0);
  }, [queue?.items]);

  if (statsLoading && queueLoading) {
    return <p className="text-muted-foreground">加载中...</p>;
  }

  function handleGrade(rating: 1 | 2 | 3 | 4) {
    if (!current) return;
    const payload = {
      item_type: current.item_type,
      item_id: current.item_id,
      rating,
    };
    setLeavingId(current.id);
    // Wait for the fade to finish before advancing and dispatching the mutation.
    // The mutation invalidation also drives the next card load via refetch.
    window.setTimeout(() => {
      grade.mutate(payload, {
        onSettled: () => {
          setLeavingId(null);
          setIndex((i) => i + 1);
          void refetch();
        },
      });
    }, 220);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.review')}</h1>
          <p className="text-sm text-muted-foreground">基于 FSRS 间隔重复算法的每日复习</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => migrate.mutate()}
          disabled={migrate.isPending}
        >
          {migrate.isPending ? '迁移中...' : '迁移旧错题'}
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <ReviewStat label="今日到期" value={stats?.due_count} accent="text-primary" />
        <ReviewStat label="今日已复习" value={stats?.reviewed_today} accent="text-success" />
        <ReviewStat label="总复习项" value={stats?.total_items} accent="text-foreground" />
      </section>

      {!current || !hasMore ? (
        <EmptyState title="今日复习已完成" description="所有到期卡片都复习完毕，明天继续加油。" />
      ) : (
        <ReviewCardView
          key={current.id}
          item={current}
          leaving={leavingId === current.id}
          isPending={grade.isPending}
          onGrade={handleGrade}
        />
      )}
    </div>
  );
}

// ─── ReviewCardView ────────────────────────────────────────────────────
// One card centered on the page. Click to flip and reveal the back, then
// the four rating buttons. A slight opacity fade plays while leavingId
// matches so transitions feel intentional.
// ────────────────────────────────────────────────────────────────────────

interface ReviewCardViewProps {
  item: ReviewItem;
  leaving: boolean;
  isPending: boolean;
  onGrade: (rating: 1 | 2 | 3 | 4) => void;
}

function ReviewCardView({ item, leaving, isPending, onGrade }: ReviewCardViewProps) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip on each new card (parent's `key={item.id}` does the heavy
  // lifting, but defensive in case).
  useEffect(() => {
    setFlipped(false);
  }, [item.id]);

  const isWrong = item.item_type === 'wrong_question';

  return (
    <div
      className={cn(
        'mx-auto flex max-w-2xl flex-col gap-4 transition-opacity duration-200',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="info">{isWrong ? '错题' : '知识卡'}</Badge>
        <span>到期: {new Date(item.due).toLocaleString('zh-CN')}</span>
      </div>

      <Card
        className="min-h-[240px] cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
          {!flipped ? (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                问题 · 点击查看答案
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([1, 2, 3, 4] as const).map((r) => (
          <Button
            key={r}
            variant={ratingVariant(r)}
            size="lg"
            disabled={isPending || !flipped}
            onClick={() => onGrade(r)}
            className="flex-col gap-0.5 py-3"
          >
            <span className="text-sm font-semibold">{RATING_LABELS[r].label}</span>
            <span className="text-[10px] font-normal opacity-80">{RATING_LABELS[r].hint}</span>
          </Button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {flipped ? '选择一个评分提交' : '点击卡片查看答案后即可评分'}
      </p>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

interface ReviewStatProps {
  label: string;
  value: number | undefined;
  accent: string;
}

function ReviewStat({ label, value, accent }: ReviewStatProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-6">
        <span className={cn('text-3xl font-bold tabular-nums', accent)}>{value ?? '—'}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

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
