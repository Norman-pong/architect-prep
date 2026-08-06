// web/src/features/review/review-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page-level loading state for /review. Equal-height to the resolved view
 * (3 stat cards + 240px review card + 2x4 rating buttons).
 */
export function ReviewCardSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      role="status"
      aria-label="加载复习卡中"
      aria-busy="true"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <Skeleton variant="text" w={64} h={30} className="block" />
            <Skeleton variant="text" w={88} h={14} className="mt-3 block" />
          </div>
        ))}
      </section>

      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="rect" w={48} h={20} r={9999} />
          <Skeleton variant="rect" w={120} h={16} r={4} />
        </div>
        <Skeleton variant="text" w={140} h={12} />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <Skeleton variant="text" w={120} h={12} />
            <Skeleton variant="text" w="80%" />
            <Skeleton variant="text" w="60%" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" h={56} r={6} />
          ))}
        </div>
        <Skeleton variant="text" w={140} h={12} className="mx-auto" />
      </div>
    </div>
  );
}
