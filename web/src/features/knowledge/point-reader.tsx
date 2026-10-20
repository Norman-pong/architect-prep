import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import { ErrorState } from '@/components/ui/error-state';
import { ChevronLeft, Search, ListTree } from 'lucide-react';
import { ChapterExamLink } from './chapter-exam-link';
import { ReaderToolbar } from './reader-toolbar';
import {
  findCrossChapterNext,
  findCrossChapterPrev,
  resolveTargetChapter,
  resolveTargetPointTitle,
} from './navigation';
import { getChapterProgress, isChapterCompleted } from './hooks';
import type { Chapter, KnowledgePoint, LearningProgress } from './types';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface PointReaderProps {
  chapter: Chapter | undefined;
  point: KnowledgePoint | undefined;
  isMastered: boolean;
  progress: LearningProgress | undefined;
  chapters: Chapter[] | undefined;
  pointsByChapter: Map<number, KnowledgePoint[]>;
  /** True while chapters and/or the current chapter's points are loading (I-04). */
  isLoading: boolean;
  /** Chapters or the current chapter's points failed to load. */
  isError: boolean;
  onRetry: () => void;
  onBack: () => void;
  onNavigate: (chapterId: number, pointId: number) => void;
  /** Jump to a chapter selected by prev/next while its points still load. */
  onNavigateToChapter: (chapterId: number, edge: 'first' | 'last') => void;
  onToggleMastered: (pointId: number, chapterId: number, mastered: boolean) => void;
  isMasteredPending: boolean;
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
  recordView: (pointId: number) => void;
}

export function PointReader({
  chapter,
  point,
  isMastered,
  progress,
  chapters,
  pointsByChapter,
  isLoading,
  isError,
  onRetry,
  onBack,
  onNavigate,
  onNavigateToChapter,
  onToggleMastered,
  isMasteredPending,
  onOpenDrawer,
  onOpenSearch,
  recordView,
}: PointReaderProps) {
  // Record view when the point changes. Skipped until the point actually exists,
  // so a loading/error frame never records a bogus id.
  useEffect(() => {
    if (point?.id) recordView(point.id);
  }, [point?.id, recordView]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-3" role="status" aria-label="加载知识点中" aria-busy="true">
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-96 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 p-3">
        <ErrorState
          title="知识点加载失败"
          description="内容暂时无法获取，请检查网络后重试。"
          onRetry={onRetry}
        />
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'mx-auto flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground',
            'transition-colors hover:bg-muted',
            FOCUS_RING,
          )}
        >
          返回目录
        </button>
      </div>
    );
  }

  if (!chapter || !point) {
    return (
      <div className="space-y-3 py-12 text-center">
        <p className="text-muted-foreground">
          {chapter ? '知识点不存在或已删除。' : '章节不存在或已删除。'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'mx-auto flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground',
            'transition-colors hover:bg-primary-hover',
            FOCUS_RING,
          )}
        >
          返回目录
        </button>
      </div>
    );
  }

  const { total, mastered } = getChapterProgress(chapter.id, progress);
  const chapterCompleted = isChapterCompleted(chapter.id, progress);
  const getPoints = (chapterId: number) => pointsByChapter.get(chapterId);
  const prevTarget = findCrossChapterPrev(chapter.id, point.id, chapters, getPoints);
  const nextTarget = findCrossChapterNext(chapter.id, point.id, chapters, getPoints);
  const prevTitle = resolveTargetPointTitle(pointsByChapter, prevTarget);
  const nextTitle = resolveTargetPointTitle(pointsByChapter, nextTarget);
  const prevChapter = resolveTargetChapter(chapters, prevTarget);
  const nextChapter = resolveTargetChapter(chapters, nextTarget);
  const prevLabel = prevTitle
    ? `上一节: ${prevTitle}`
    : prevChapter
      ? `上一章: ${prevChapter.title}`
      : '已是第一个';
  const nextLabel = nextTitle
    ? `下一节: ${nextTitle}`
    : nextChapter
      ? `下一章: ${nextChapter.title}`
      : '已是最后一个';

  return (
    // min-h + negative bottom margin mirror the authenticated layout's content
    // padding (mobile: pt-3 + pb(12px + safe-area); desktop: md:p-8 = 32px). That
    // makes the scroll area exactly one viewport tall and lets the sticky footer
    // sit flush with the viewport bottom for short chapters instead of floating
    // mid-document (I-16). The footer's own safe-area padding keeps its content
    // above the home indicator.
    <div className="flex min-h-[calc(100dvh_-_0.75rem)] flex-col -mb-[calc(0.75rem_+_env(safe-area-inset-bottom))] md:min-h-[calc(100dvh_-_2rem)] md:-mb-8">
      <h1 className="sr-only">
        {chapter.chapter_no}. {chapter.title}
      </h1>

      {/* Top sticky bar */}
      <div className="sticky top-0 z-sticky flex h-12 items-center justify-between gap-2 border-b border-border bg-card px-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted',
            FOCUS_RING,
          )}
          aria-label="返回目录"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>

        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {chapter.chapter_no}. {chapter.title}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted',
              FOCUS_RING,
            )}
            aria-label="搜索"
          >
            <Search className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onOpenDrawer}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted',
              FOCUS_RING,
            )}
            aria-label="目录"
          >
            <ListTree className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Chapter sub-header */}
      <div className="sticky top-12 z-sticky flex h-9 items-center justify-between border-b border-border bg-background px-3">
        <span className="text-xs text-muted-foreground">第 {chapter.chapter_no} 章</span>
        <span
          className={cn('text-xs', chapterCompleted ? 'text-success' : 'text-muted-foreground')}
        >
          {chapterCompleted ? '本章已学完' : `${mastered}/${total} 已学`}
        </span>
      </div>

      {/* Content — flex-1 pushes the toolbar to the bottom for short articles. */}
      <div className="knowledge-prose flex-1 px-3 pb-6 pt-4 text-base leading-relaxed md:text-sm md:leading-normal">
        <Markdown content={point.content} skipFirstHeading />
      </div>

      <ChapterExamLink chapterId={chapter.id} />

      <ReaderToolbar
        chapter={chapter}
        point={point}
        isMastered={isMastered}
        isMasteredPending={isMasteredPending}
        prevTarget={prevTarget}
        nextTarget={nextTarget}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        onNavigate={onNavigate}
        onNavigateToChapter={onNavigateToChapter}
        onToggleMastered={onToggleMastered}
      />
    </div>
  );
}
