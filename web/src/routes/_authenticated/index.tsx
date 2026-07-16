import { Book, FileText, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useOverallProgress } from '@/features/learning/queries';
import { useChapters } from '@/features/knowledge/hooks';
import { useSetHeader } from '@/components/layout/header-context';
import type { PracticeStats } from '@/features/practice/types';
import type { ReviewStats } from '@/features/review/types';

const BookIcon = Book;
const QuizIcon = FileText;
const ProgressIcon = TrendingUp;
const ArrowRightIcon = ArrowRight;
const ReviewIcon = RefreshCw;
export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: progress, isLoading: progressLoading } = useOverallProgress();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();

  const { data: practiceStats, isLoading: statsLoading } = useQuery({
    queryKey: ['practice', 'stats'],
    queryFn: async () => {
      const resp = await api.get('/practice/stats');
      return resp.data.data as PracticeStats;
    },
  });

  const { data: reviewStats } = useQuery({
    queryKey: ['review', 'stats'],
    queryFn: async () => {
      const resp = await api.get('/review/stats');
      return resp.data.data as ReviewStats;
    },
  });

  const totalPoints = progress?.total_points ?? 0;
  const masteredPoints = progress?.mastered_points ?? 0;
  const coverage = progress ? Math.floor(progress.coverage * 100) : 0;

  const totalQuestions = practiceStats?.total_questions ?? 0;
  const accuracy = practiceStats ? Math.round(practiceStats.accuracy * 100) : undefined;
  const hasPracticeData = practiceStats && practiceStats.total_questions > 0;

  const dueCount = reviewStats?.due_count ?? 0;

  const reviewedToday = reviewStats?.reviewed_today ?? 0;

  // Push page-level config into the unified Header (rendered by the layout).
  // Subtitle carries the quick status snapshot so users see it without scrolling
  // past three large stat cards on mobile.
  const subtitle = dueCount > 0 ? `今日到期 ${dueCount} 张卡片` : '今天没有需要复习的卡片';
  useSetHeader({ title: '学习仪表盘', subtitle });

  return (
    <div className="space-y-4">
      {/* 今日复习 — 置顶 CTA */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ReviewIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">今日复习</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {dueCount > 0
                  ? `今日到期 ${dueCount} 张卡片 · 已复习 ${reviewedToday}`
                  : '今天没有需要复习的卡片'}
              </p>
            </div>
          </div>
          <Link
            to="/review"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {dueCount > 0 ? '开始复习' : '查看复习'}
            <ArrowRightIcon className="size-4" />
          </Link>
        </CardContent>
      </Card>

      {/* 统计：3 卡 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 学习进度 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">学习进度</CardTitle>
            <ProgressIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressLoading ? '--' : `${coverage}%`}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressLoading ? 0 : coverage}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {progressLoading ? '--' : `${masteredPoints} / ${totalPoints} 知识点`}
            </p>
          </CardContent>
        </Card>

        {/* 知识体系 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">知识体系</CardTitle>
            <BookIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chaptersLoading ? '--' : (chapters?.length ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">教材章节</p>
          </CardContent>
        </Card>

        {/* 刷题情况 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">刷题情况</CardTitle>
            <QuizIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold">{statsLoading ? '--' : totalQuestions}</div>
              {accuracy !== undefined && hasPracticeData && (
                <div className="text-sm text-muted-foreground">正确率 {accuracy}%</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">已练习题目数</p>
          </CardContent>
        </Card>
      </div>

      {/* 考试信息 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>考试信息</CardTitle>
          <Link
            to="/knowledge"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            开始学习
            <ArrowRightIcon className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium text-foreground">综合知识</p>
            <Badge variant="info" className="mt-2">
              75 题选择 / 150 分钟
            </Badge>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium text-foreground">案例分析</p>
            <Badge variant="info" className="mt-2">
              5 选 3 / 90 分钟
            </Badge>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium text-foreground">论文写作</p>
            <Badge variant="info" className="mt-2">
              4 选 1 / 120 分钟
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
