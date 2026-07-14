import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Chapter, LearningProgress, KnowledgePoint } from './types';
import { getChapterProgress, isChapterCompleted } from './hooks';

interface DesktopOutlineProps {
  chapters: Chapter[] | undefined;
  pointsMap: Map<number, KnowledgePoint[]>;
  progress: LearningProgress | undefined;
  isLoading: boolean;
  onToggleMastered: (pointId: number, mastered: boolean) => void;
  onExpandChapter: (chapterId: number) => void;
  pointStatusMap: Map<number, boolean>;
}

export function DesktopOutline({
  chapters,
  pointsMap,
  progress,
  isLoading,
  onToggleMastered,
  onExpandChapter,
  pointStatusMap,
}: DesktopOutlineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback(
    (id: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          // Fetch point statuses when expanding
          onExpandChapter(id);
        }
        return next;
      });
    },
    [onExpandChapter],
  );

  const expandAll = useCallback(() => {
    if (!chapters) return;
    const allIds = new Set(chapters.map((c) => c.id));
    setExpandedIds(allIds);
    // Fetch statuses for all chapters
    chapters.forEach((c) => onExpandChapter(c.id));
  }, [chapters, onExpandChapter]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={expandAll}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          全部展开
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          全部折叠
        </button>
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {sorted.map((ch) => {
          const { total, mastered } = getChapterProgress(ch.id, progress);
          const completed = isChapterCompleted(ch.id, progress);
          const isExpanded = expandedIds.has(ch.id);
          const points = pointsMap.get(ch.id) ?? [];

          return (
            <div
              key={ch.id}
              className={cn(
                'rounded-lg border border-border bg-card overflow-hidden',
                completed && 'border-l-4 border-l-success',
              )}
            >
              {/* Chapter header */}
              <button
                type="button"
                onClick={() => toggleExpand(ch.id)}
                className="flex w-full min-h-[56px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    'bg-primary text-sm font-bold text-primary-foreground',
                  )}
                >
                  {ch.chapter_no}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-foreground truncate">{ch.title}</div>
                  {total > 0 && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            completed ? 'bg-success' : 'bg-primary',
                          )}
                          style={{ width: `${total > 0 ? (mastered / total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {mastered}/{total}
                      </span>
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="size-5" />
                  ) : (
                    <ChevronDown className="size-5" />
                  )}
                </span>
              </button>

              {/* Expanded points */}
              {isExpanded && points.length > 0 && (
                <div className="border-t border-border px-4 pb-4">
                  <ol className="ml-12 mt-3 space-y-3 border-l border-border pl-4">
                    {points.map((pt, idx) => {
                      const isMastered = pointStatusMap.get(pt.id) ?? false;

                      return (
                        <li key={pt.id} className="relative">
                          {/* Dot indicator */}
                          <span className="absolute -left-[calc(1rem+5px)] top-2 h-2 w-2 rounded-full bg-border" />

                          <article
                            className={cn(
                              'rounded-md border border-border bg-card p-4',
                              'transition-colors hover:border-primary/30',
                            )}
                          >
                            {/* Point header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="info" className="shrink-0">
                                  {idx + 1}
                                </Badge>
                                <h4 className="text-sm font-semibold text-foreground">
                                  {pt.title}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => onToggleMastered(pt.id, !isMastered)}
                                className={cn(
                                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                                  isMastered
                                    ? 'bg-success text-success-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-muted',
                                )}
                              >
                                {isMastered ? '已学' : '标记已学'}
                              </button>
                            </div>

                            {/* Content */}
                            <div className="mt-3">
                              <Markdown content={pt.content} skipFirstHeading />
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
