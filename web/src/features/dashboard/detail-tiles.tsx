import { Link } from '@tanstack/react-router';
import { AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { BentoCard, BentoLinkCard } from '@/components/ui/bento';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { PracticeStats } from '@/features/practice/types';
import { TileError, TileSkeleton } from './tile-parts';

interface TileStatusProps {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

interface PracticeTileProps extends TileStatusProps {
  stats?: PracticeStats;
}

/** Overall practice accuracy. */
export function PracticeTile({ stats, isLoading, isError, onRetry }: PracticeTileProps) {
  if (isLoading) {
    return (
      <BentoCard size="stat" minH="half" className="md:order-4">
        <TileSkeleton lines={2} />
      </BentoCard>
    );
  }
  if (isError) {
    return (
      <BentoCard size="stat" minH="half" className="md:order-4">
        <TileError onRetry={onRetry} />
      </BentoCard>
    );
  }

  const answered = stats?.total_questions ?? 0;
  const hasData = answered > 0;
  const accuracy = hasData ? Math.round((stats?.accuracy ?? 0) * 100) : 0;

  return (
    <BentoLinkCard
      size="stat"
      minH="half"
      className="md:order-4"
      render={<Link to="/stats" aria-label="查看学习统计" />}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">刷题正确率</span>
        <FileText className="size-4 text-muted-foreground" aria-hidden />
      </div>
      {hasData ? (
        <>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            <AnimatedNumber value={accuracy} />%
          </p>
          <p className="mt-auto pt-2 text-xs text-muted-foreground">已答 {answered} 题</p>
        </>
      ) : (
        <>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            还没有练习记录，先来一组 20 题。
          </p>
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary">
            去练习
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
        </>
      )}
    </BentoLinkCard>
  );
}

interface WrongTileProps extends TileStatusProps {
  total?: number;
}

/** Wrong-question count + entry. */
export function WrongTile({ total, isLoading, isError, onRetry }: WrongTileProps) {
  if (isLoading) {
    return (
      <BentoCard size="third" minH="half" className="md:order-5">
        <TileSkeleton lines={2} />
      </BentoCard>
    );
  }
  if (isError) {
    return (
      <BentoCard size="third" minH="half" className="md:order-5">
        <TileError onRetry={onRetry} />
      </BentoCard>
    );
  }

  const count = total ?? 0;

  return (
    <BentoLinkCard
      size="third"
      minH="half"
      className="md:order-5"
      render={<Link to="/wrong-questions" aria-label="进入错题本" />}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">错题本</span>
        <AlertCircle className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
        <AnimatedNumber value={count} />
        <span className="ml-1 text-sm font-medium text-muted-foreground">道</span>
      </p>
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary">
        {count > 0 ? '去重做' : '暂无错题'}
        <ChevronRight className="size-3.5" aria-hidden />
      </span>
    </BentoLinkCard>
  );
}

export interface WeakChapterItem {
  chapterId: number;
  chapterNo: number;
  title: string;
  mastered: number;
  total: number;
}

interface WeakChaptersTileProps extends TileStatusProps {
  items: WeakChapterItem[];
}

/** Top 5 weakest / not-yet-mastered chapters, each row is a 44px link. */
export function WeakChaptersTile({ items, isLoading, isError, onRetry }: WeakChaptersTileProps) {
  if (isLoading) {
    return (
      <BentoCard size="wide" minH="wide" className="md:order-6">
        <TileSkeleton lines={5} />
      </BentoCard>
    );
  }
  if (isError) {
    return (
      <BentoCard size="wide" minH="wide" className="md:order-6">
        <TileError onRetry={onRetry} />
      </BentoCard>
    );
  }

  return (
    <BentoCard size="wide" minH="wide" className="md:order-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">待学 / 薄弱章节</h2>
        <Link
          to="/knowledge"
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary/5"
        >
          全部章节
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">全部章节已掌握</p>
      ) : (
        <ul className="mt-1 divide-y divide-border">
          {items.map((item) => {
            const pct = item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0;
            return (
              <li key={item.chapterId}>
                <Link
                  to="/knowledge"
                  search={{ chapter: item.chapterId }}
                  className="flex min-h-11 items-center gap-3 rounded-md px-1 py-2 text-sm hover:bg-muted/50"
                >
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {item.chapterNo}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{item.title}</span>
                  <span className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.mastered}/{item.total}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}

const EXAM_INFO = [
  { name: '综合知识', detail: '75 题选择 / 150 分钟' },
  { name: '案例分析', detail: '5 选 3 / 90 分钟' },
  { name: '论文写作', detail: '4 选 1 / 120 分钟' },
] as const;

/** Static exam-format reference (no per-user data). */
export function ExamInfoTile() {
  return (
    <BentoCard size="third" minH="half" className="md:order-7">
      <h2 className="text-sm font-semibold text-foreground">考试信息</h2>
      <ul className="mt-2 space-y-1.5">
        {EXAM_INFO.map((exam) => (
          <li key={exam.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-foreground">{exam.name}</span>
            <span className="text-muted-foreground">{exam.detail}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/knowledge"
        className="mt-auto inline-flex min-h-11 items-center gap-1 pt-2 text-xs font-medium text-primary hover:underline"
      >
        开始学习
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </BentoCard>
  );
}
