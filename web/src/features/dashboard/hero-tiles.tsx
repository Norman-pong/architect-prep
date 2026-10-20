import { ArrowRight, BookOpen, RefreshCw, TrendingUp } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { BentoCard, BentoLinkCard } from '@/components/ui/bento';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { LastProgress, ProgressResponse } from '@/features/learning/queries';
import type { ReviewStats } from '@/features/review/types';
import { ProgressRing, TileError, TileSkeleton } from './tile-parts';

interface TileStatusProps {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

interface ReviewHeroTileProps extends TileStatusProps {
  stats?: ReviewStats;
}

/** Today's review: the primary action on the dashboard. */
export function ReviewHeroTile({ stats, isLoading, isError, onRetry }: ReviewHeroTileProps) {
  if (isLoading) {
    return (
      <BentoCard size="hero" tone="hero" minH="hero" className="md:order-1">
        <TileSkeleton lines={2} />
      </BentoCard>
    );
  }
  if (isError) {
    return (
      <BentoCard size="hero" tone="hero" minH="hero" className="md:order-1">
        <TileError onRetry={onRetry} />
      </BentoCard>
    );
  }

  const due = stats?.due_count ?? 0;
  const reviewed = stats?.reviewed_today ?? 0;
  const todayTotal = due + reviewed;
  const progress = todayTotal > 0 ? Math.round((reviewed / todayTotal) * 100) : 100;

  return (
    <BentoLinkCard
      size="hero"
      tone="hero"
      minH="hero"
      className="md:order-1"
      render={<Link to="/review" aria-label="进入今日复习" />}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <RefreshCw className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">今日复习</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {due > 0 ? (
              <>
                还有 <AnimatedNumber value={due} /> 张卡片待复习
              </>
            ) : (
              '今天没有到期卡片'
            )}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:inline-flex">
          {due > 0 ? '开始复习' : '查看复习'}
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
      <div className="mt-auto space-y-2 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>今日进度</span>
          <span className="tabular-nums">
            {reviewed}/{todayTotal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary sm:hidden">
          {due > 0 ? '开始复习' : '查看复习'}
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </BentoLinkCard>
  );
}

interface ProgressTileProps extends TileStatusProps {
  progress?: ProgressResponse;
  chapterCount?: number;
}

/** Learning coverage ring + mastered points. */
export function ProgressTile({
  progress,
  chapterCount,
  isLoading,
  isError,
  onRetry,
}: ProgressTileProps) {
  if (isLoading) {
    return (
      <BentoCard size="stat" minH="half" className="md:order-2">
        <TileSkeleton lines={2} />
      </BentoCard>
    );
  }
  if (isError) {
    return (
      <BentoCard size="stat" minH="half" className="md:order-2">
        <TileError onRetry={onRetry} />
      </BentoCard>
    );
  }

  const coverage = progress ? Math.floor(progress.coverage * 100) : 0;
  const mastered = progress?.mastered_points ?? 0;
  const total = progress?.total_points ?? 0;

  return (
    <BentoLinkCard
      size="stat"
      minH="half"
      className="md:order-2"
      render={<Link to="/knowledge" aria-label="进入知识体系" />}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">学习进度</span>
        <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="mt-2 flex flex-1 flex-row items-center gap-2">
        <ProgressRing value={coverage} size={56} />
        <div className="min-w-0">
          <p className="text-base font-semibold tabular-nums text-foreground">
            {mastered} <span className="text-xs font-normal text-muted-foreground">/ {total}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">已掌握 · {chapterCount ?? 0} 章</p>
        </div>
      </div>
    </BentoLinkCard>
  );
}

interface ContinueTileProps extends TileStatusProps {
  last?: LastProgress | null;
  fallbackChapterId?: number;
}

/** Resume the last-read knowledge point (falls back to the first chapter). */
export function ContinueTile({
  last,
  fallbackChapterId,
  isLoading,
  isError,
  onRetry,
}: ContinueTileProps) {
  if (isLoading) {
    return (
      <BentoCard size="third" minH="half" className="md:order-3">
        <TileSkeleton lines={2} />
      </BentoCard>
    );
  }
  if (isError) {
    return (
      <BentoCard size="third" minH="half" className="md:order-3">
        <TileError onRetry={onRetry} />
      </BentoCard>
    );
  }

  const search = last
    ? { chapter: last.chapter_id, point: last.point_id }
    : fallbackChapterId
      ? { chapter: fallbackChapterId }
      : {};

  return (
    <BentoLinkCard
      size="third"
      minH="half"
      className="md:order-3"
      render={
        <Link
          to="/knowledge"
          search={search}
          aria-label={last ? '继续上次学习' : '开始学习知识体系'}
        />
      }
    >
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BookOpen className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-medium text-muted-foreground">继续学习</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
        {last ? last.title : '从第 1 章开始'}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary">
        继续
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </BentoLinkCard>
  );
}
