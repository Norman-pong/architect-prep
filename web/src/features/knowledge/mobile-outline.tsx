import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Chapter, LearningProgress } from './types';
import { getChapterProgress, isChapterCompleted } from './hooks';

interface MobileOutlineProps {
  chapters: Chapter[] | undefined;
  progress: LearningProgress | undefined;
  isLoading: boolean;
  onSelectChapter: (chapterId: number) => void;
  lastProgress: { chapter_id: number; point_id: number; title: string } | null;
  onContinue: () => void;
}

export function MobileOutline({
  chapters,
  progress,
  isLoading,
  onSelectChapter,
  lastProgress,
  onContinue,
}: MobileOutlineProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">还没有章节。运行 seed 脚本导入数据。</p>
      </div>
    );
  }

  const sorted = [...chapters].sort((a, b) => a.chapter_no - b.chapter_no);

  return (
    <div className="flex flex-col">
      {/* Chapter list — per mobile-learning-design §1.2 视图 A:
          chapter row navigates to the reader view (?chapter=X). The first
          point is auto-selected by index.tsx useEffect. No inline expand. */}
      <div className="divide-y divide-border pb-16">
        {sorted.map((ch) => {
          const { total, mastered } = getChapterProgress(ch.id, progress);
          const completed = isChapterCompleted(ch.id, progress);

          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onSelectChapter(ch.id)}
              aria-label={`${ch.chapter_no} ${ch.title}`}
              className={cn(
                'flex w-full min-h-[56px] items-center gap-3 px-3 py-3 text-left transition-colors',
                'hover:bg-muted/50 active:bg-muted/70',
                completed && 'border-l-4 border-l-success bg-success/5',
              )}
            >
              {/* Chapter number badge */}
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  'bg-primary text-sm font-bold text-primary-foreground',
                )}
              >
                {ch.chapter_no}
              </span>

              {/* Title + summary */}
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-foreground truncate">{ch.title}</div>
                {ch.summary && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{ch.summary}</p>
                )}
              </div>

              {/* Progress */}
              {total > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {mastered}/{total}
                  {completed ? ' 已学完' : ' 已学'}
                </span>
              )}

              {/* Navigate-to-reader indicator */}
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                <ArrowRight className="size-5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Continue learning FAB — icon-only on mobile to avoid covering the last chapter row.
          (Desktop layouts keep the wider labeled version via responsive classes.) */}
      {lastProgress && (
        <button
          type="button"
          onClick={onContinue}
          aria-label="继续上次学习"
          title="继续学习"
          className={cn(
            'fixed bottom-4 right-4 z-40 flex items-center gap-2',
            'h-12 w-12 justify-center rounded-full bg-primary text-primary-foreground',
            'shadow-lg transition-transform hover:scale-105 active:scale-95',
            'sm:h-12 sm:w-auto sm:px-4 sm:gap-2',
          )}
        >
          <ArrowRight className="size-5" />
          <span className="hidden sm:inline">继续学习</span>
        </button>
      )}
    </div>
  );
}
