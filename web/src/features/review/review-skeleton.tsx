import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for /review. Mirrors the current resolved layout — compact
 * 2×2 today metrics (~120px), one review card and a 2×2 rating grid — inside
 * the same max-w-3xl container as the page, so the swap does not jump (R5).
 */
export function ReviewCardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-3xl space-y-5 animate-fadeIn"
      role="status"
      aria-label="加载复习卡中"
      aria-busy="true"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card px-3 py-1.5">
            <Skeleton variant="text" w={64} h={18} className="block" />
            <Skeleton variant="text" w={48} h={12} className="mt-1 block" />
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="rect" w={48} h={20} r={9999} />
          <Skeleton variant="rect" w={112} h={16} r={4} />
        </div>
        <Skeleton variant="text" w={140} h={12} />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <Skeleton variant="text" w={160} h={12} />
            <Skeleton variant="text" w="80%" />
            <Skeleton variant="text" w="60%" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" h={56} r={6} />
          ))}
        </div>
        <Skeleton variant="text" w={180} h={12} className="mx-auto" />
      </div>
    </div>
  );
}
