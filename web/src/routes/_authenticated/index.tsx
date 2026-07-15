import { Book, FileText, TrendingUp, CheckCircle, ArrowRight, Play } from 'lucide-react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useOverallProgress, useLastProgress } from '@/features/learning/queries';
import { useChapters } from '@/features/knowledge/hooks';
import type { PracticeStats } from '@/features/practice/types';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

const BookIcon = Book;
const QuizIcon = FileText;
const ProgressIcon = TrendingUp;
const CheckIcon = CheckCircle;
const ArrowRightIcon = ArrowRight;
const PlayIcon = Play;

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: progress, isLoading: progressLoading } = useOverallProgress();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const lastProgress = useLastProgress();

  const { data: practiceStats, isLoading: statsLoading } = useQuery({
    queryKey: ['practice', 'stats'],
    queryFn: async () => {
      const resp = await api.get('/practice/stats');
      return resp.data.data as PracticeStats;
    },
  });

  const totalPoints = progress?.total_points ?? 0;
  const masteredPoints = progress?.mastered_points ?? 0;
  const coverage = progress ? Math.floor(progress.coverage * 100) : 0;
  const isCoverageComplete = coverage === 100 && totalPoints > 0;

  const totalQuestions = practiceStats?.total_questions ?? 0;
  const accuracy = practiceStats ? Math.round(practiceStats.accuracy * 100) : undefined;
  const hasPracticeData = practiceStats && practiceStats.total_questions > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('app.title')}</h1>
        <p className="text-muted-foreground">{t('app.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-xs text-muted-foreground">
              {progressLoading ? '--' : `${masteredPoints}/${totalPoints} 知识点已掌握`}
            </p>
          </CardContent>
        </Card>

        {/* 题库 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">题库</CardTitle>
            <QuizIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '--' : totalQuestions}</div>
            <p className="text-xs text-muted-foreground">题目</p>
          </CardContent>
        </Card>

        {/* 学习进度 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">学习进度</CardTitle>
            <ProgressIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isCoverageComplete ? 'text-success' : ''}`}>
              {progressLoading ? '--' : `${coverage}%`}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressLoading ? 0 : coverage}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {progressLoading ? '--' : `${masteredPoints}/${totalPoints} 知识点已掌握`}
            </p>
          </CardContent>
        </Card>

        {/* 正确率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">正确率</CardTitle>
            <CheckIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading || !hasPracticeData ? '--' : `${accuracy}%`}
            </div>
            <p className="text-xs text-muted-foreground">练习正确率</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>考试信息</CardTitle>
          <div className="flex items-center gap-2">
            {lastProgress && (
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: '/knowledge',
                    search: { chapter: lastProgress.chapter_id, point: lastProgress.point_id },
                  })
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                继续学习: {lastProgress.title}
                <PlayIcon className="size-4" />
              </button>
            )}
            <Link
              to="/knowledge"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              开始学习
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/40">
            <span className="text-sm font-medium">综合知识</span>
            <Badge variant="info">75题选择题 / 150分钟</Badge>
          </div>
          <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/40">
            <span className="text-sm font-medium">案例分析</span>
            <Badge variant="info">5选3 / 90分钟</Badge>
          </div>
          <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/40">
            <span className="text-sm font-medium">论文写作</span>
            <Badge variant="info">4选1 / 120分钟</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
