import { X } from 'lucide-react';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Chapter, KnowledgePoint, LearningProgress } from './types';
import { getChapterProgress } from './hooks';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface ChapterDrawerProps {
  open: boolean;
  onClose: () => void;
  chapters: Chapter[] | undefined;
  pointsByChapter: Map<number, KnowledgePoint[]>;
  progress: LearningProgress | undefined;
  pointStatusMap: Map<number, boolean>;
  currentChapterId: number | undefined;
  currentPointId: number | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Selecting a chapter always navigates — even when its points aren't loaded
   *  yet, in which case the page resolves the first point after loading (I-01). */
  onSelectChapter: (chapterId: number) => void;
  onSelectPoint: (chapterId: number, pointId: number) => void;
  skeletonRows: number;
}

/**
 * Mobile chapter drawer. Built on the shared Base UI dialog primitive so focus
 * trapping / focus return / Escape / scroll lock are handled by the platform
 * (I-13); the slide-in animation rides on Base UI's data-starting-style /
 * data-ending-style attributes.
 */
export function ChapterDrawer({
  open,
  onClose,
  chapters,
  pointsByChapter,
  progress,
  pointStatusMap,
  currentChapterId,
  currentPointId,
  isLoading,
  isError,
  onRetry,
  onSelectChapter,
  onSelectPoint,
  skeletonRows,
}: ChapterDrawerProps) {
  const sortedChapters = chapters ? [...chapters].sort((a, b) => a.chapter_no - b.chapter_no) : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          className={cn(
            'fixed bottom-0 left-auto right-0 top-0 flex h-full w-[min(86vw,320px)] max-w-none translate-x-0 translate-y-0 flex-col',
            'gap-0 rounded-none border-0 border-l border-border bg-card p-0 shadow-xl',
            'transition-transform duration-200 ease-out',
            'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
            'data-[starting-style]:opacity-100 data-[ending-style]:opacity-100',
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
            <DialogTitle className="text-sm font-semibold text-foreground">知识体系</DialogTitle>
            <DialogClose
              aria-label="关闭目录"
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted',
                FOCUS_RING,
              )}
            >
              <X className="size-5" aria-hidden />
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {isLoading ? (
              <div role="status" aria-label="加载章节目录中" aria-busy="true">
                {Array.from({ length: skeletonRows }).map((_, index) => (
                  <div key={index} className="flex min-h-[44px] items-center gap-2 px-4 py-2">
                    <Skeleton variant="circle" w={28} h={28} />
                    <Skeleton variant="text" w="70%" h={16} />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <ErrorState
                  compact
                  title="章节目录加载失败"
                  description="请检查网络后重试。"
                  onRetry={onRetry}
                />
              </div>
            ) : sortedChapters.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">还没有章节。</p>
            ) : (
              sortedChapters.map((chapter) => {
                const points = pointsByChapter.get(chapter.id) ?? [];
                const { total, mastered } = getChapterProgress(chapter.id, progress);
                const isCurrentChapter = chapter.id === currentChapterId;

                return (
                  <div key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => onSelectChapter(chapter.id)}
                      aria-current={isCurrentChapter ? 'true' : undefined}
                      aria-label={`第 ${chapter.chapter_no} 章 ${chapter.title}，已学 ${mastered}/${total}`}
                      className={cn(
                        'flex min-h-[44px] w-full items-center gap-2 px-4 py-2 text-left transition-colors',
                        'hover:bg-muted/50',
                        isCurrentChapter && 'bg-primary/10',
                        FOCUS_RING,
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isCurrentChapter
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {chapter.chapter_no}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-foreground">
                        {chapter.title}
                      </span>
                      {total > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {mastered}/{total}
                        </span>
                      )}
                    </button>

                    {points.length > 0 && (
                      <div className="ml-4 border-l border-border pl-2">
                        {points.map((point) => {
                          const isCurrentPoint = point.id === currentPointId;
                          const isMastered = pointStatusMap.get(point.id) ?? false;

                          return (
                            <button
                              key={point.id}
                              type="button"
                              onClick={() => onSelectPoint(chapter.id, point.id)}
                              aria-current={isCurrentPoint ? 'true' : undefined}
                              aria-label={`${point.title}${isMastered ? '，已学' : ''}`}
                              className={cn(
                                'flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                                'hover:bg-muted/50',
                                isCurrentPoint && 'bg-primary/10',
                                FOCUS_RING,
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 shrink-0 rounded-full',
                                  isCurrentPoint
                                    ? 'bg-primary'
                                    : isMastered
                                      ? 'bg-success'
                                      : 'bg-transparent',
                                )}
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  'flex-1 truncate text-sm',
                                  isCurrentPoint
                                    ? 'font-medium text-foreground'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {point.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
