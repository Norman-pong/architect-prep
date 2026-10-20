import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BentoGrid } from '@/components/ui/bento';
import { useSetHeader } from '@/components/layout/header-context';
import { useOverallProgress } from '@/features/learning/queries';
import { useChapters } from '@/features/knowledge/hooks';
import { usePracticeStats, useWrongQuestionsTotal } from '@/features/practice/queries';
import { useReviewStats } from '@/features/review/queries';
import { ContinueTile, ProgressTile, ReviewHeroTile } from '@/features/dashboard/hero-tiles';
import {
  ExamInfoTile,
  PracticeTile,
  WeakChaptersTile,
  WrongTile,
  type WeakChapterItem,
} from '@/features/dashboard/detail-tiles';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const progressQuery = useOverallProgress();
  const chaptersQuery = useChapters();
  const practiceQuery = usePracticeStats();
  const reviewQuery = useReviewStats();
  const wrongQuery = useWrongQuestionsTotal();

  const sortedChapters = useMemo(
    () => [...(chaptersQuery.data ?? [])].sort((a, b) => a.chapter_no - b.chapter_no),
    [chaptersQuery.data],
  );

  const weakChapters = useMemo<WeakChapterItem[]>(() => {
    const chaptersById = new Map(sortedChapters.map((chapter) => [chapter.id, chapter]));
    const perChapter = progressQuery.data?.per_chapter ?? [];
    return perChapter
      .filter((entry) => entry.total > 0)
      .map((entry) => {
        const chapter = chaptersById.get(entry.chapter_id);
        return {
          chapterId: entry.chapter_id,
          chapterNo: chapter?.chapter_no ?? entry.chapter_id,
          title: chapter?.title ?? `第 ${entry.chapter_id} 章`,
          mastered: entry.mastered,
          total: entry.total,
          ratio: entry.mastered / entry.total,
        };
      })
      .sort((a, b) => a.ratio - b.ratio || a.mastered - b.mastered || a.chapterNo - b.chapterNo)
      .slice(0, 5);
  }, [progressQuery.data?.per_chapter, sortedChapters]);

  const dueCount = reviewQuery.data?.due_count ?? 0;
  const subtitle = reviewQuery.data
    ? dueCount > 0
      ? `今日到期 ${dueCount} 张卡片`
      : '今天没有需要复习的卡片'
    : undefined;
  useSetHeader({ title: '学习仪表盘', subtitle });

  return (
    <BentoGrid>
      <ReviewHeroTile
        stats={reviewQuery.data}
        isLoading={reviewQuery.isLoading}
        isError={reviewQuery.isError}
        onRetry={() => void reviewQuery.refetch()}
      />
      <ContinueTile
        last={progressQuery.data?.last_progress}
        fallbackChapterId={sortedChapters[0]?.id}
        isLoading={progressQuery.isLoading}
        isError={progressQuery.isError}
        onRetry={() => void progressQuery.refetch()}
      />
      <ProgressTile
        progress={progressQuery.data}
        chapterCount={chaptersQuery.data ? sortedChapters.length : undefined}
        isLoading={progressQuery.isLoading}
        isError={progressQuery.isError}
        onRetry={() => void progressQuery.refetch()}
      />
      <PracticeTile
        stats={practiceQuery.data}
        isLoading={practiceQuery.isLoading}
        isError={practiceQuery.isError}
        onRetry={() => void practiceQuery.refetch()}
      />
      <WrongTile
        total={wrongQuery.data}
        isLoading={wrongQuery.isLoading}
        isError={wrongQuery.isError}
        onRetry={() => void wrongQuery.refetch()}
      />
      <WeakChaptersTile
        items={weakChapters}
        isLoading={progressQuery.isLoading || chaptersQuery.isLoading}
        isError={progressQuery.isError || chaptersQuery.isError}
        onRetry={() => {
          void progressQuery.refetch();
          void chaptersQuery.refetch();
        }}
      />
      <ExamInfoTile />
    </BentoGrid>
  );
}
