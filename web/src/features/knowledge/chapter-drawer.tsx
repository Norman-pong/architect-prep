import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Chapter, KnowledgePoint, LearningProgress } from './types';
import { getChapterProgress } from './hooks';

interface ChapterDrawerProps {
  open: boolean;
  onClose: () => void;
  chapters: Chapter[] | undefined;
  pointsMap: Map<number, KnowledgePoint[]>;
  progress: LearningProgress | undefined;
  currentChapterId: number | undefined;
  currentPointId: number | undefined;
  onSelect: (chapterId: number, pointId: number) => void;
}

export function ChapterDrawer({
  open,
  onClose,
  chapters,
  pointsMap,
  progress,
  currentChapterId,
  currentPointId,
  onSelect,
}: ChapterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!chapters) return null;

  const sorted = [...chapters].sort((a, b) => a.chapter_no - b.chapter_no);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[min(86vw,320px)] flex-col',
          'bg-card shadow-xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="章节目录"
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">知识体系</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
            aria-label="关闭"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {sorted.map((ch) => {
            const points = pointsMap.get(ch.id) ?? [];
            const { total, mastered } = getChapterProgress(ch.id, progress);
            const isCurrentChapter = ch.id === currentChapterId;

            return (
              <div key={ch.id}>
                {/* Chapter row */}
                <button
                  type="button"
                  onClick={() => {
                    if (points.length > 0) {
                      onSelect(ch.id, points[0].id);
                    }
                    onClose();
                  }}
                  className={cn(
                    'flex w-full min-h-[44px] items-center gap-2 px-4 py-2 text-left transition-colors',
                    'hover:bg-muted/50',
                    isCurrentChapter && 'bg-primary/10',
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
                    {ch.chapter_no}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-foreground">
                    {ch.title}
                  </span>
                  {total > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {mastered}/{total}
                    </span>
                  )}
                </button>

                {/* Points */}
                {points.length > 0 && (
                  <div className="ml-4 border-l border-border pl-2">
                    {points.map((pt) => {
                      const isCurrentPoint = pt.id === currentPointId;
                      const isMastered = false; // Will be populated by parent if needed

                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => {
                            onSelect(ch.id, pt.id);
                            onClose();
                          }}
                          className={cn(
                            'flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left transition-colors',
                            'hover:bg-muted/50',
                            isCurrentPoint && 'bg-primary/10',
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
                          />
                          <span
                            className={cn(
                              'flex-1 truncate text-sm',
                              isCurrentPoint
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground',
                            )}
                          >
                            {pt.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
