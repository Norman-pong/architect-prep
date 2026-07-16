import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useChapters } from '@/features/knowledge/hooks';
import { useSetHeader } from '@/components/layout/header-context';
import type { ChapterStat, PracticeStats } from './types';

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
        <span className="text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
        <span className="text-xs text-muted-foreground">正确率</span>
      </div>
    </div>
  );
}

export function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['practice-stats'],
    queryFn: async () => {
      const resp = await api.get('/practice/stats');
      return resp.data.data as PracticeStats;
    },
  });
  const { data: chapters } = useChapters();

  // The page title is rendered by the layout Header; nothing else belongs in the chrome.
  useSetHeader({ title: '学习统计' });

  if (isLoading) {
    return <p className="text-muted-foreground">加载中...</p>;
  }

  if (!stats || stats.total_questions === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BarChart3 className="size-6" />
            </div>
            <p className="text-foreground">还没有练习记录</p>
            <p className="text-sm text-muted-foreground">去刷题，统计会在这里实时更新</p>
            <Link
              to="/practice"
              className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
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
    <div className="space-y-4">
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
              <div className="text-3xl font-bold text-foreground">{stats.total_questions}</div>
              <p className="mt-1 text-sm text-muted-foreground">总答题数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-success">{stats.correct_count}</div>
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
            sortedChapters.map((cs) => {
              const ch = chapterMap.get(cs.chapter_id);
              const title = ch ? `${ch.chapter_no} ${ch.title}` : `第${cs.chapter_id}章`;
              const pct = Math.round(cs.accuracy * 100);
              return (
                <div key={cs.chapter_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-foreground">{title}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">
                      {cs.correct_count}/{cs.total_questions} · {pct}%
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
