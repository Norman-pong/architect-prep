// web/src/routes/_authenticated/dashboard-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Page-level loading state for / (Dashboard). Equal-height to the resolved
 * view (CTA band + 4 stat cards in 2x2 / xl:4-col grid + exam info card) so
 * the swap causes zero CLS. Visual shimmer comes from PR1's <Skeleton/>.
 */
export function DashboardSkeleton() {
  return (
    <div
      className="space-y-4 animate-fadeIn"
      role="status"
      aria-label="加载仪表盘中"
      aria-busy="true"
    >
      {/* CTA band */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex items-center justify-between gap-4 p-5 pl-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" w={48} h={48} />
            <div className="min-w-0 space-y-2">
              <Skeleton variant="text" w={96} h={20} />
              <Skeleton variant="text" w={180} h={14} />
            </div>
          </div>
          <Skeleton variant="rect" w={96} h={40} r={6} />
        </CardContent>
      </Card>

      {/* 4 stat cards — mobile 2x2, xl 1x4 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-3">
              <Skeleton variant="text" w={64} h={14} />
              <Skeleton variant="rect" w={16} h={16} r={4} />
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
              <Skeleton variant="text" w={56} h={28} />
              <Skeleton variant="text" w={120} h={12} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam info card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <Skeleton variant="text" w={80} h={20} />
          <Skeleton variant="rect" w={80} h={32} r={6} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-border bg-muted/30 px-4 py-3">
              <Skeleton variant="text" w={64} h={16} />
              <Skeleton variant="rect" w={120} h={20} r={9999} className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
