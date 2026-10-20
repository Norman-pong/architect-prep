import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';

/**
 * Mirrors the real WrongQuestionsPage first screen inside the same max-w-5xl
 * container as the page (R5): count badge placeholder (mobile) + 3 collapsed
 * cards (header row + question title, no options until expanded).
 */
export function WrongQuestionsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-4"
      aria-busy="true"
      role="status"
      aria-label="加载错题列表"
    >
      <div className="md:hidden">
        <Skeleton variant="rect" w={88} h={24} r={9999} />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton variant="rect" w={36} h={20} />
                <Skeleton variant="rect" w={72} h={20} />
                <Skeleton variant="text" w={92} />
              </div>
              <Skeleton variant="rect" w={64} h={44} r={6} />
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" w="85%" />
              <Skeleton variant="text" w="55%" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
