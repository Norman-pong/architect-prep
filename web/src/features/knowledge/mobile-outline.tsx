import { ArrowRight } from 'lucide-react';

import { EmptyState, EmptyIllustration } from '@/components/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { KnowledgeOutlineSkeleton } from './knowledge-skeleton';
import { cn } from '@/lib/utils';
import type { Chapter, LearningProgress } from './types';
import { getChapterProgress, isChapterCompleted } from './hooks';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface MobileOutlineProps {
  chapters: Chapter[] | undefined;
  progress: LearningProgress | undefined;
  isLoading: boolean;
  isError: boolean;
  progressError: boolean;
  onRetry: () => void;
  onRetryProgress: () => void;
  onSelectChapter: (chapterId: number) => void;
  lastProgress: { chapter_id: number; point_id: number; title: string } | null;
  onContinue: () => void;
  skeletonRows: number;
}

export function MobileOutline({
  chapters,
  progress,
  isLoading,
  isError,
  progressError,
  onRetry,
  onRetryProgress,
  onSelectChapter,
  lastProgress,
  onContinue,
  skeletonRows,
}: MobileOutlineProps) {
  if (isLoading) {
    return <KnowledgeOutlineSkeleton variant="mobile" rows={skeletonRows} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="章节目录加载失败"
        description="知识体系数据暂时无法获取，请检查网络后重试。"
        onRetry={onRetry}
      />
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <EmptyState
        icon={<EmptyIllustration name="empty-questions" />}
        title="还没有章节"
        description="运行 seed 脚本导入数据,即可看到章节列表。"
      />
    );
  }

  const sortedChapters = [...chapters].sort((a, b) => a.chapter_no - b.chapter_no);

  return (
    <div className="flex flex-col">
      {progressError && (
        <div className="pb-3">
          <ErrorState
            compact
            title="学习进度加载失败"
            description="章节仍可阅读，重试可恢复进度显示。"
            onRetry={onRetryProgress}
          />
        </div>
      )}

      {/* Chapter list — per mobile-learning-design §1.2 视图 A:
          a chapter row opens the reader at that chapter's first point. */}
      <div className="divide-y divide-border pb-16">
        {sortedChapters.map((chapter) => {
          const { total, mastered } = getChapterProgress(chapter.id, progress);
          const completed = isChapterCompleted(chapter.id, progress);

          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onSelectChapter(chapter.id)}
              aria-label={`${chapter.chapter_no} ${chapter.title}，共 ${total} 个知识点，已学 ${mastered} 个`}
              className={cn(
                'flex min-h-[56px] w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                'hover:bg-muted/50 active:bg-muted/70',
                completed && 'border-l-4 border-l-success bg-success/5',
                FOCUS_RING,
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {chapter.chapter_no}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium text-foreground">
                  {chapter.title}
                </span>
                {chapter.summary && (
                  <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                    {chapter.summary}
                  </span>
                )}
              </span>

              {total > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {mastered}/{total}
                  {completed ? ' 已学完' : ' 已学'}
                </span>
              )}

              <span className="shrink-0 text-muted-foreground" aria-hidden>
                <ArrowRight className="size-5" />
              </span>
            </button>
          );
        })}
      </div>

      {lastProgress && (
        <button
          type="button"
          onClick={onContinue}
          aria-label={`继续上次学习：${lastProgress.title}`}
          title="继续学习"
          className={cn(
            'fixed bottom-4 right-4 z-sticky flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg',
            'transition-transform hover:scale-105 active:scale-95 sm:w-auto sm:px-4',
            FOCUS_RING,
          )}
        >
          <ArrowRight className="size-5" aria-hidden />
          <span className="hidden sm:inline">继续学习</span>
        </button>
      )}
    </div>
  );
}
