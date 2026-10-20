import { ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState, EmptyIllustration } from '@/components/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { KnowledgeOutlineSkeleton } from './knowledge-skeleton';
import { ChapterPointsList } from './chapter-points';
import { cn } from '@/lib/utils';
import type { ChapterPointsStatus } from './use-knowledge-data';
import type { Chapter, LearningProgress, KnowledgePoint } from './types';
import { getChapterProgress, getMasteryLevel, isChapterCompleted } from './hooks';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface DesktopOutlineProps {
  chapters: Chapter[] | undefined;
  pointsByChapter: Map<number, KnowledgePoint[]>;
  chapterPointsStatus: Map<number, ChapterPointsStatus>;
  progress: LearningProgress | undefined;
  isLoading: boolean;
  isError: boolean;
  progressError: boolean;
  onRetryChapters: () => void;
  onRetryProgress: () => void;
  expandedChapterIds: ReadonlySet<number>;
  onToggleChapter: (chapterId: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectPoint: (chapterId: number, pointId: number) => void;
  onToggleMastered: (pointId: number, chapterId: number, mastered: boolean) => void;
  onRetryChapter: (chapterId: number) => void;
  pointStatusMap: Map<number, boolean>;
  pendingMasteredPointId: number | undefined;
  skeletonRows: number;
}

export function DesktopOutline({
  chapters,
  pointsByChapter,
  chapterPointsStatus,
  progress,
  isLoading,
  isError,
  progressError,
  onRetryChapters,
  onRetryProgress,
  expandedChapterIds,
  onToggleChapter,
  onExpandAll,
  onCollapseAll,
  onSelectPoint,
  onToggleMastered,
  onRetryChapter,
  pointStatusMap,
  pendingMasteredPointId,
  skeletonRows,
}: DesktopOutlineProps) {
  if (isLoading) {
    return <KnowledgeOutlineSkeleton variant="desktop" rows={skeletonRows} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="章节目录加载失败"
        description="知识体系数据暂时无法获取，请检查网络后重试。"
        onRetry={onRetryChapters}
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
  const allExpanded = sortedChapters.every((chapter) => expandedChapterIds.has(chapter.id));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={allExpanded ? onCollapseAll : onExpandAll}
          className={cn(
            'min-h-11 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            FOCUS_RING,
          )}
        >
          {allExpanded ? '全部折叠' : '全部展开'}
        </button>
      </div>

      {progressError && (
        <ErrorState
          compact
          title="学习进度加载失败"
          description="章节知识点仍可阅读，重试可恢复进度统计。"
          onRetry={onRetryProgress}
        />
      )}

      {/* Chapter list — every expanded chapter loads its own points (I-03). */}
      <div className="space-y-3">
        {sortedChapters.map((chapter) => {
          const { total, mastered } = getChapterProgress(chapter.id, progress);
          const completed = isChapterCompleted(chapter.id, progress);
          const masteryLevel = getMasteryLevel(mastered, total);
          const isExpanded = expandedChapterIds.has(chapter.id);
          const points = pointsByChapter.get(chapter.id) ?? [];

          return (
            <div
              key={chapter.id}
              className={cn(
                'overflow-hidden rounded-lg border border-border bg-card',
                completed && 'border-l-4 border-l-success',
              )}
            >
              <button
                type="button"
                onClick={() => onToggleChapter(chapter.id)}
                aria-expanded={isExpanded}
                aria-label={`${chapter.chapter_no} ${chapter.title}，共 ${total} 个知识点，已学 ${mastered} 个`}
                className={cn(
                  'flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30',
                  FOCUS_RING,
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {chapter.chapter_no}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-medium text-foreground">
                    {chapter.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          total === 0
                            ? 'bg-muted-foreground/40'
                            : completed
                              ? 'bg-success'
                              : masteryLevel === 'warning'
                                ? 'bg-warning'
                                : masteryLevel === 'destructive'
                                  ? 'bg-destructive/70'
                                  : 'bg-primary',
                        )}
                        style={{ width: `${total > 0 ? (mastered / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mastered}/{total}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-muted-foreground" aria-hidden>
                  {isExpanded ? (
                    <ChevronUp className="size-5" />
                  ) : (
                    <ChevronDown className="size-5" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <ChapterPointsList
                  chapterId={chapter.id}
                  points={points}
                  status={chapterPointsStatus.get(chapter.id)}
                  pointStatusMap={pointStatusMap}
                  pendingMasteredPointId={pendingMasteredPointId}
                  onSelectPoint={onSelectPoint}
                  onToggleMastered={onToggleMastered}
                  onRetry={onRetryChapter}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
