import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import { EmptyState, EmptyIllustration } from '@/components/empty-state';
import { KnowledgeOutlineSkeleton } from './knowledge-skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Chapter, LearningProgress, KnowledgePoint } from './types';
import { getChapterProgress, getMasteryLevel, isChapterCompleted } from './hooks';

interface DesktopOutlineProps {
  chapters: Chapter[] | undefined;
  pointsMap: Map<number, KnowledgePoint[]>;
  progress: LearningProgress | undefined;
  isLoading: boolean;
  onToggleMastered: (pointId: number, mastered: boolean) => void;
  onExpandChapter: (chapterId: number) => void;
  onSelectPoint: (chapterId: number, pointId: number) => void;
  pointStatusMap: Map<number, boolean>;
}

export function DesktopOutline({
  chapters,
  pointsMap,
  progress,
  isLoading,
  onToggleMastered,
  onExpandChapter,
  onSelectPoint,
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
    return <KnowledgeOutlineSkeleton variant="desktop" />;
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
          const masteryLevel = getMasteryLevel(mastered, total);
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
                  {/* Progress: B-012 fix — track is always rendered so the rail
                      stays visible even when mastered=0 or total=0. The fill
                      collapses to 0% but the muted rail signals "in progress".
                      width: w-24 (96px) keeps the ratio easy to read at a
                      glance without crowding the row. */}
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
                        style={{
                          width: `${total > 0 ? (mastered / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mastered}/{total}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="size-5" />
                  ) : (
                    <ChevronDown className="size-5" />
                  )}
                </span>
              </button>

              {/* Expanded points: title list only — no inline Markdown.
                  Click a row to enter the reading view (?chapter=X&point=Y). */}
              {isExpanded && points.length > 0 && (
                <div className="border-t border-border px-4 pb-3">
                  <ol className="ml-12 mt-2 space-y-1 border-l border-border pl-4">
                    {points.map((pt, idx) => {
                      const isMastered = pointStatusMap.get(pt.id) ?? false;

                      return (
                        <li key={pt.id} className="relative">
                          <span className="absolute -left-[calc(1rem+5px)] top-3 h-2 w-2 rounded-full bg-border" />
                          <div className="group flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/40">
                            <button
                              type="button"
                              onClick={() => onSelectPoint(ch.id, pt.id)}
                              className="flex flex-1 items-center gap-2 text-left"
                            >
                              {isMastered ? (
                                <CheckCircle2
                                  className="size-4 shrink-0 text-success"
                                  aria-hidden
                                />
                              ) : (
                                <Circle
                                  className="size-4 shrink-0 text-muted-foreground/60"
                                  aria-hidden
                                />
                              )}
                              <Badge variant="info" className="shrink-0">
                                {idx + 1}
                              </Badge>
                              <span className="text-sm text-foreground group-hover:text-primary">
                                {pt.title}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleMastered(pt.id, !isMastered)}
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                                isMastered
                                  ? 'bg-success/10 text-success hover:bg-success/20'
                                  : 'bg-secondary text-secondary-foreground hover:bg-muted',
                              )}
                            >
                              {isMastered ? '已学' : '标记已学'}
                            </button>
                          </div>
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
