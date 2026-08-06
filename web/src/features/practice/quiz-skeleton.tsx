// web/src/features/practice/quiz-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page-level loading state for /practice. Equal-height to the resolved
 * view (PageHero + question card + 4 options + submit button).
 */
export function QuizSkeleton() {
  return (
    <div
      className="space-y-6 animate-fadeIn"
      role="status"
      aria-label="加载题目中"
      aria-busy="true"
    >
      {/* Mobile-only progress badge band */}
      <div className="md:hidden flex h-9 items-center justify-end gap-2 px-3 py-2">
        <Skeleton variant="rect" w={72} h={20} r={9999} />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton variant="rect" w={56} h={20} r={9999} />
          <Skeleton variant="rect" w={72} h={20} r={9999} />
          <Skeleton variant="rect" w={68} h={20} r={9999} className="ml-auto" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" w="85%" />
          <Skeleton variant="text" w="60%" />
        </div>
        <div className="mt-4 space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map((key) => (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Skeleton variant="rect" w={28} h={28} r={6} />
              <Skeleton variant="text" className="flex-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Skeleton variant="rect" w={96} h={40} r={6} />
      </div>
    </div>
  );
}
