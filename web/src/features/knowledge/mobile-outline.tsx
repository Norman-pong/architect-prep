import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import type { Chapter, LearningProgress } from './types';
import { getChapterProgress, isChapterCompleted } from './hooks';
import { useChapterPoints } from './hooks';

interface MobileOutlineProps {
  chapters: Chapter[] | undefined;
  progress: LearningProgress | undefined;
  isLoading: boolean;
  onSelectPoint: (chapterId: number, pointId: number) => void;
  lastProgress: { chapter_id: number; point_id: number; title: string } | null;
  onContinue: () => void;
}

export function MobileOutline({
  chapters,
  progress,
  isLoading,
  onSelectPoint,
  lastProgress,
  onContinue,
}: MobileOutlineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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
      {/* Chapter list */}
      <div className="divide-y divide-border">
        {sorted.map((ch) => {
          const { total, mastered } = getChapterProgress(ch.id, progress);
          const completed = isChapterCompleted(ch.id, progress);
          const isExpanded = expandedIds.has(ch.id);

          return (
            <div key={ch.id}>
              <button
                type="button"
                onClick={() => toggleExpand(ch.id)}
                aria-label={`${ch.chapter_no} ${ch.title}`}
                aria-expanded={isExpanded}
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
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {ch.summary}
                    </p>
                  )}
                </div>

                {/* Progress */}
                {total > 0 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {mastered}/{total}
                    {completed ? ' 已学完' : ' 已学'}
                  </span>
                )}

                {/* Expand chevron */}
                <span className="shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="size-5" />
                  ) : (
                    <ChevronDown className="size-5" />
                  )}
                </span>
              </button>

              {/* Expanded points */}
              {isExpanded && (
                <MobileChapterPoints chapterId={ch.id} onSelectPoint={onSelectPoint} />
              )}
            </div>
          );
        })}
      </div>

      {/* Continue learning FAB */}
      {lastProgress && (
        <button
          type="button"
          onClick={onContinue}
          className={cn(
            'fixed bottom-4 right-4 z-40 flex items-center gap-2',
            'h-12 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground',
            'shadow-lg transition-transform hover:scale-105 active:scale-95',
          )}
        >
          <span>继续学习</span>
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

function MobileChapterPoints({
  chapterId,
  onSelectPoint,
}: {
  chapterId: number;
  onSelectPoint?: (chapterId: number, pointId: number) => void;
}) {
  const { data: points } = useChapterPoints(chapterId);

  if (!points || points.length === 0) {
    return <div className="px-3 py-2 text-xs text-muted-foreground">暂无知识点</div>;
  }

  return (
    <div className="border-t border-border bg-muted/20">
      {points.map((pt) => (
        <button
          key={pt.id}
          type="button"
          onClick={() => onSelectPoint?.(chapterId, pt.id)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="flex-1 truncate">{pt.title}</span>
        </button>
      ))}
    </div>
  );
}
