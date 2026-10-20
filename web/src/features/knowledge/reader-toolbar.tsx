import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChapterNavTarget } from './navigation';
import type { Chapter, KnowledgePoint } from './types';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface ReaderToolbarProps {
  chapter: Chapter;
  point: KnowledgePoint;
  isMastered: boolean;
  isMasteredPending: boolean;
  prevTarget: ChapterNavTarget | null;
  nextTarget: ChapterNavTarget | null;
  prevLabel: string;
  nextLabel: string;
  onNavigate: (chapterId: number, pointId: number) => void;
  onNavigateToChapter: (chapterId: number, edge: 'first' | 'last') => void;
  onToggleMastered: (pointId: number, chapterId: number, mastered: boolean) => void;
}

/**
 * Sticky reader footer: previous section / mark-as-learned / next section.
 * Prev/next targets come from the pure cross-chapter helpers; while a target
 * chapter's points are still loading the button stays enabled and jumps to the
 * chapter, where the page resolves the first/last point (I-02).
 */
export function ReaderToolbar({
  chapter,
  point,
  isMastered,
  isMasteredPending,
  prevTarget,
  nextTarget,
  prevLabel,
  nextLabel,
  onNavigate,
  onNavigateToChapter,
  onToggleMastered,
}: ReaderToolbarProps) {
  const goTo = (target: ChapterNavTarget | null, edge: 'first' | 'last') => {
    if (!target) return;
    if (target.pointId !== undefined) {
      onNavigate(target.chapterId, target.pointId);
    } else {
      onNavigateToChapter(target.chapterId, edge);
    }
  };

  return (
    <div className="sticky bottom-0 z-sticky flex min-h-[68px] items-center gap-2 border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
      <button
        type="button"
        disabled={!prevTarget}
        onClick={() => goTo(prevTarget, 'last')}
        title={prevLabel}
        aria-label={prevLabel}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors',
          prevTarget
            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            : 'bg-muted text-muted-foreground opacity-40',
          FOCUS_RING,
        )}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => onToggleMastered(point.id, chapter.id, !isMastered)}
        disabled={isMasteredPending}
        aria-busy={isMasteredPending}
        className={cn(
          'flex h-11 min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors',
          isMastered
            ? 'bg-success text-success-foreground'
            : 'bg-primary text-primary-foreground hover:bg-primary-hover',
          'disabled:cursor-not-allowed disabled:opacity-60',
          FOCUS_RING,
        )}
      >
        <Check className="size-4" aria-hidden />
        <span>{isMasteredPending ? '保存中…' : isMastered ? '已学' : '标记已学'}</span>
      </button>

      <button
        type="button"
        disabled={!nextTarget}
        onClick={() => goTo(nextTarget, 'first')}
        title={nextLabel}
        aria-label={nextLabel}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors',
          nextTarget
            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            : 'bg-muted text-muted-foreground opacity-40',
          FOCUS_RING,
        )}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
