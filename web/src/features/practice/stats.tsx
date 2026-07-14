import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PracticeStats } from './types';

export function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['practice-stats'],
    queryFn: async () => {
      const resp = await api.get('/practice/stats');
      return resp.data.data as PracticeStats;
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">加载中...</p>;
  }

  if (!stats || stats.total_questions === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">还没有练习记录，去刷题吧！</p>
        </CardContent>
      </Card>
    );
  }

  const accuracyPct = Math.round(stats.accuracy * 100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">学习统计</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.total_questions}</div>
            <p className="text-sm text-muted-foreground">总答题数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-success">{stats.correct_count}</div>
            <p className="text-sm text-muted-foreground">正确数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div
              className={cn(
                'text-3xl font-bold',
                accuracyPct >= 60 ? 'text-success' : 'text-destructive',
              )}
            >
              {accuracyPct}%
            </div>
            <p className="text-sm text-muted-foreground">正确率</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-chapter accuracy bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">各章节掌握情况</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(stats.chapter_stats ?? []).map((cs) => {
            const pct = Math.round(cs.accuracy * 100);
            return (
              <div key={cs.chapter_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>第{cs.chapter_id}章</span>
                  <span className="text-muted-foreground">
                    {cs.correct_count}/{cs.total_questions} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-destructive',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
