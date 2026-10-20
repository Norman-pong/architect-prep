import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Mirror of the StatsPage layout: 96px ring + 2 stat tiles + 1 chapter
 * stats card. Equal-height to the resolved view (zero CLS).
 */
export function StatsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-4"
      aria-busy="true"
      role="status"
      aria-label="加载学习统计"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <Card className="flex items-center justify-center p-6">
          <Skeleton variant="circle" w={96} h={96} />
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <Skeleton variant="text" w={60} h={28} />
              <Skeleton variant="text" w={72} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <Skeleton variant="text" w={60} h={28} />
              <Skeleton variant="text" w={72} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton variant="text" w={160} h={18} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" w="60%" />
                <Skeleton variant="text" w={64} />
              </div>
              <Skeleton variant="rect" w="100%" h={8} r={9999} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
