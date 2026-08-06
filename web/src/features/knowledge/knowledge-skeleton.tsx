import { Skeleton } from '@/components/ui/skeleton';

interface KnowledgeOutlineSkeletonProps {
  /** mobile: 12 flat rows. desktop: 12 expanded-card placeholders + toolbar row. */
  variant?: 'mobile' | 'desktop';
  /** Number of placeholder rows. Defaults to 12 to match the typical chapter count. */
  rows?: number;
}

/**
 * Mirrors the real <MobileOutline /> / <DesktopOutline /> layout while
 * chapters load. Equal-height to the resolved view (zero CLS). Shimmer
 * comes from PR1's <Skeleton/> primitive.
 */
export function KnowledgeOutlineSkeleton({
  variant = 'mobile',
  rows = 12,
}: KnowledgeOutlineSkeletonProps) {
  if (variant === 'desktop') {
    return (
      <div
        className="space-y-4 animate-fadeIn"
        role="status"
        aria-label="加载章节目录中"
        aria-busy="true"
      >
        <div className="flex items-center justify-end gap-2">
          <Skeleton variant="rect" w={64} h={28} r={6} />
          <Skeleton variant="rect" w={64} h={28} r={6} />
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" w={40} h={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" w="60%" />
                  <Skeleton variant="rect" w={96} h={6} r={9999} />
                </div>
                <Skeleton variant="rect" w={20} h={20} r={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-border animate-fadeIn"
      role="status"
      aria-label="加载章节目录中"
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-[56px] items-center gap-3 px-3 py-3">
          <Skeleton variant="circle" w={40} h={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" w="40%" />
            <Skeleton variant="text" w="80%" h={12} />
          </div>
          <Skeleton variant="rect" w={40} h={14} r={4} />
        </div>
      ))}
    </div>
  );
}
