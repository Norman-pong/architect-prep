import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import { ChevronLeft, ChevronRight, Search, Menu, Check } from 'lucide-react';
import type { Chapter, KnowledgePoint, PointStatus, LearningProgress } from './types';
import { getChapterProgress, isChapterCompleted } from './hooks';

interface PointReaderProps {
  chapter: Chapter | undefined;
  point: KnowledgePoint | undefined;
  pointStatus: PointStatus | undefined;
  progress: LearningProgress | undefined;
  chapters: Chapter[] | undefined;
  pointsMap: Map<number, KnowledgePoint[]>;
  isLoading: boolean;
  onBack: () => void;
  onNavigate: (chapterId: number, pointId: number) => void;
  onToggleMastered: (pointId: number, mastered: boolean) => void;
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
  recordView: (pointId: number) => void;
}
export function PointReader({
  chapter,
  point,
  pointStatus,
  progress,
  chapters,
  pointsMap,
  isLoading,
  onBack,
  onNavigate,
  onToggleMastered,
  onOpenDrawer,
  onOpenSearch,
  recordView,
}: PointReaderProps) {
  // Record view when point changes
  useEffect(() => {
    if (point?.id) {
      recordView(point.id);
    }
  }, [point?.id, recordView]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-3">
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-96 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!chapter || !point) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">知识点不存在或已删除。</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          返回目录
        </button>
      </div>
    );
  }

  const { total, mastered } = getChapterProgress(chapter.id, progress);
  const chapterCompleted = isChapterCompleted(chapter.id, progress);
  const isMastered = pointStatus?.mastered ?? false;
  // Build flat sorted list of all points across all chapters for cross-chapter navigation
  const sortedChapters = chapters ? [...chapters].sort((a, b) => a.chapter_no - b.chapter_no) : [];
  const allPointsFlat: KnowledgePoint[] = sortedChapters.flatMap(
    (ch) => pointsMap.get(ch.id) ?? [],
  );
  const currentIdx = allPointsFlat.findIndex((p) => p.id === point.id);
  const prevPoint = currentIdx > 0 ? allPointsFlat[currentIdx - 1] : null;
  const nextPoint = currentIdx < allPointsFlat.length - 1 ? allPointsFlat[currentIdx + 1] : null;
  // Determine target chapter for prev/next
  const prevChapter = prevPoint
    ? sortedChapters.find((ch) => ch.id === prevPoint.chapter_id)
    : null;
  const nextChapter = nextPoint
    ? sortedChapters.find((ch) => ch.id === nextPoint.chapter_id)
    : null;

  return (
    <div className="flex flex-col">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          aria-label="返回目录"
        >
          <ChevronLeft className="size-5" />
        </button>

        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {chapter.chapter_no}. {chapter.title}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
            aria-label="搜索"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
            aria-label="目录"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Chapter sub-header */}
      <div className="sticky top-12 z-20 flex h-9 items-center justify-between border-b border-border bg-background px-3">
        <span className="text-xs text-muted-foreground">第 {chapter.chapter_no} 章</span>
        <span
          className={cn('text-xs', chapterCompleted ? 'text-success' : 'text-muted-foreground')}
        >
          {chapterCompleted ? '本章已学完' : `${mastered}/${total} 已学`}
        </span>
      </div>

      {/* Content */}
      <div className="knowledge-prose flex-1 px-3 py-4 text-base leading-relaxed md:text-sm md:leading-normal">
        <Markdown content={point.content} skipFirstHeading />
      </div>

      {/* Bottom sticky toolbar */}
      <div className="sticky bottom-0 z-30 flex h-14 items-center gap-2 border-t border-border bg-card px-2">
        {/* Prev */}
        <button
          type="button"
          disabled={!prevPoint}
          onClick={() => prevPoint && prevChapter && onNavigate(prevChapter.id, prevPoint.id)}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium transition-colors',
            prevPoint
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-muted text-muted-foreground opacity-50',
          )}
        >
          <ChevronLeft className="size-4" />
          <span className="truncate">{prevPoint ? prevPoint.title : '已是第一个'}</span>
        </button>

        {/* Master toggle */}
        <button
          type="button"
          onClick={() => onToggleMastered(point.id, !isMastered)}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium transition-colors',
            isMastered
              ? 'bg-success text-success-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover',
          )}
        >
          {isMastered ? (
            <>
              <Check className="size-4" />
              <span>已学</span>
            </>
          ) : (
            <>
              <Check className="size-4" />
              <span>标记已学</span>
            </>
          )}
        </button>

        {/* Next */}
        <button
          type="button"
          disabled={!nextPoint}
          onClick={() => nextPoint && nextChapter && onNavigate(nextChapter.id, nextPoint.id)}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium transition-colors',
            nextPoint
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-muted text-muted-foreground opacity-50',
          )}
        >
          <span className="truncate">{nextPoint ? nextPoint.title : '已是最后一个'}</span>
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
