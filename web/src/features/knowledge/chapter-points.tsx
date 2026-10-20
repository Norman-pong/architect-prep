import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ChapterPointsStatus } from './use-knowledge-data';
import type { KnowledgePoint } from './types';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface ChapterPointsListProps {
  chapterId: number;
  points: KnowledgePoint[];
  status: ChapterPointsStatus | undefined;
  pointStatusMap: Map<number, boolean>;
  pendingMasteredPointId: number | undefined;
  onSelectPoint: (chapterId: number, pointId: number) => void;
  onToggleMastered: (pointId: number, chapterId: number, mastered: boolean) => void;
  onRetry: (chapterId: number) => void;
}

/**
 * Points of one expanded desktop chapter. Each chapter owns its loading/error/
 * empty state so "全部展开" shows every chapter's real state instead of one
 * shared empty list (I-03).
 */
export function ChapterPointsList({
  chapterId,
  points,
  status,
  pointStatusMap,
  pendingMasteredPointId,
  onSelectPoint,
  onToggleMastered,
  onRetry,
}: ChapterPointsListProps) {
  if (!status || status.isLoading) {
    return (
      <div
        className="ml-12 mt-2 space-y-2 border-l border-border pb-1 pl-4"
        role="status"
        aria-label="加载本章知识点"
        aria-busy="true"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="text" w={`${85 - index * 12}%`} h={20} />
        ))}
      </div>
    );
  }

  if (status.isError) {
    return (
      <div className="px-4 pb-3 pt-2">
        <ErrorState
          compact
          title="本章知识点加载失败"
          description="请检查网络后重试。"
          onRetry={() => onRetry(chapterId)}
        />
      </div>
    );
  }

  if (status.isEmpty || points.length === 0) {
    return <p className="pb-3 pl-16 pt-2 text-sm text-muted-foreground">本章暂无知识点。</p>;
  }

  return (
    <div className="border-t border-border px-4 pb-3">
      <ol className="ml-12 mt-2 space-y-1 border-l border-border pl-4">
        {points.map((point, index) => {
          const isMastered = pointStatusMap.get(point.id) ?? false;
          const isPending = pendingMasteredPointId === point.id;
          return (
            <li key={point.id} className="relative">
              <span
                className="absolute -left-[calc(1rem+5px)] top-5 h-2 w-2 rounded-full bg-border"
                aria-hidden
              />
              <div className="group flex items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/40">
                <button
                  type="button"
                  onClick={() => onSelectPoint(chapterId, point.id)}
                  className={cn('flex min-h-11 flex-1 items-center gap-2 text-left', FOCUS_RING)}
                >
                  {isMastered ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                  )}
                  <Badge variant="info" className="shrink-0">
                    {index + 1}
                  </Badge>
                  <span className="text-sm text-foreground group-hover:text-primary">
                    {point.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMastered(point.id, chapterId, !isMastered)}
                  disabled={isPending}
                  aria-busy={isPending}
                  aria-label={
                    isMastered ? `取消标记《${point.title}》为已学` : `标记《${point.title}》为已学`
                  }
                  className={cn(
                    'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-medium',
                    'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    isMastered
                      ? 'bg-success/10 text-success hover:bg-success/20'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted',
                    FOCUS_RING,
                  )}
                >
                  {isPending ? '…' : isMastered ? '已学' : '标记已学'}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
