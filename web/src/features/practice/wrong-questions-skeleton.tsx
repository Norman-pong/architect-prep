import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Mirrors the real WrongQuestionsPage layout: count badge placeholder
 * (mobile) + 3 collapsed cards stacked vertically. CLS = 0 because the
 * placeholder heights match the real Card + content.
 */
export function WrongQuestionsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" role="status" aria-label="加载错题列表">
      <div className="md:hidden">
        <Skeleton variant="rect" w={88} h={24} r={9999} />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton variant="rect" w={36} h={20} />
                <Skeleton variant="rect" w={72} h={20} />
                <Skeleton variant="text" w={92} />
              </div>
              <Skeleton variant="rect" w={48} h={28} />
            </div>
            <Skeleton variant="text" w="85%" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} variant="rect" w="100%" h={44} />
            ))}
            <div className="flex justify-end">
              <Skeleton variant="rect" w={72} h={32} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
