import { Link } from '@tanstack/react-router';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { useChapters } from '@/features/knowledge/hooks';
import { useSetHeader } from '@/components/layout/header-context';
import { StatsSkeleton } from './stats-skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { usePracticeStats } from './queries';
import type { ChapterStat } from './types';

/** Map a 0..1 accuracy ratio to a Tailwind color class (matches knowledge mastery colors). */
function accuracyLevel(accuracy: number): 'destructive' | 'warning' | 'primary' | 'success' {
  if (accuracy < 0.3) return 'destructive';
  if (accuracy < 0.6) return 'warning';
  if (accuracy < 0.8) return 'primary';
  return 'success';
}

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const level = accuracyLevel(accuracy);
  const fill =
    level === 'destructive'
      ? 'bg-destructive/70'
      : level === 'warning'
        ? 'bg-warning'
        : level === 'primary'
          ? 'bg-primary'
          : 'bg-success';
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full transition-all', fill)}
        style={{ width: `${accuracy * 100}%` }}
      />
    </div>
  );
}

function AccuracyRing({ accuracy, size = 96 }: { accuracy: number; size?: number }) {
  const pct = Math.round(accuracy * 100);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * accuracy;
  const level = accuracyLevel(accuracy);
  const ringColor =
    level === 'destructive'
      ? 'stroke-destructive'
      : level === 'warning'
        ? 'stroke-warning'
        : level === 'primary'
          ? 'stroke-primary'
          : 'stroke-success';
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-muted"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn(ringColor, 'transition-all')}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          <AnimatedNumber value={pct} duration={500} />%
        </span>
        <span className="text-xs text-muted-foreground">正确率</span>
      </div>
    </div>
  );
}

export function StatsPage() {
  const statsQuery = usePracticeStats();
  const { data: stats, isLoading, isError, refetch } = statsQuery;
  const { data: chapters } = useChapters();

  // The page title is rendered by the layout Header; nothing else belongs in the chrome.
  useSetHeader({ title: '学习统计' });

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <ErrorState
          title="统计数据加载失败"
          description="暂时无法获取练习统计，请检查网络后重试。"
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!stats || stats.total_questions === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BarChart3 className="size-6" />
            </div>
            <p className="text-foreground">还没有练习记录</p>
            <p className="text-sm text-muted-foreground">去刷题，统计会在这里实时更新</p>
            <Link
              to="/practice"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              开始刷题
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accuracy = stats.accuracy;
  const chapterMap = new Map((chapters ?? []).map((c) => [c.id, c]));
  // Sort by accuracy ascending — weakest chapters rise to the top, easiest to spot gaps.
  const sortedChapters: ChapterStat[] = [...(stats.chapter_stats ?? [])].sort(
    (a, b) => a.accuracy - b.accuracy,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Overview: ring + totals. On mobile (<640px) the ring and the two
          totals cards stack vertically — a 2-column row was squeezing the
          ring/buttons into a 125px column on a 390px screen. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <Card className="flex items-center justify-center p-6">
          <AccuracyRing accuracy={accuracy} />
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">
                <AnimatedNumber value={stats.total_questions} duration={500} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">总答题数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-success">
                <AnimatedNumber value={stats.correct_count} duration={500} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">正确数</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Per-chapter: title, weak-first, 4-level color */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">各章节掌握情况（薄弱优先）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedChapters.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">暂无章节数据</p>
          ) : (
            sortedChapters.map((cs, index) => {
              // The backend can omit chapter_id for answers whose chapter no
              // longer exists; render that bucket as "未归类" (Phase 2 will
              // design its treatment, here we only keep keys/text valid).
              const chapterId = cs.chapter_id ?? 0;
              const ch = chapterMap.get(chapterId);
              const title =
                ch && chapterId !== 0
                  ? `${ch.chapter_no} ${ch.title}`
                  : chapterId === 0
                    ? '未归类'
                    : `第${chapterId}章`;
              const pct = Math.round(cs.accuracy * 100);
              return (
                <div
                  key={chapterId === 0 ? `unclassified-${index}` : chapterId}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-foreground">{title}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">
                      {cs.correct_count}/{cs.total_questions} ·{' '}
                      <AnimatedNumber value={pct} duration={400} />%
                    </span>
                  </div>
                  <AccuracyBar accuracy={cs.accuracy} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
