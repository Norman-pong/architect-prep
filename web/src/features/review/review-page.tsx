import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyIllustration, EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { ReviewCardView, ReviewMetricsStrip } from './review-card';
import { useReviewQueue } from './use-review-queue';
import { useReviewMigrate } from './queries';
import { ReviewCardSkeleton } from './review-skeleton';
import { useSetHeader } from '@/components/layout/header-context';

export function ReviewPage() {
  const { t } = useTranslation();
  const {
    current,
    leavingId,
    locked,
    gradeError,
    hasMore,
    metrics,
    isLoading,
    isError,
    retry,
    handleGrade,
  } = useReviewQueue();
  const migrate = useReviewMigrate();
  const [migrateError, setMigrateError] = useState('');

  useSetHeader({
    title: t('nav.review'),
    subtitle: '基于 FSRS 间隔重复算法的每日复习',
  });

  function handleMigrate() {
    setMigrateError('');
    migrate.mutate(undefined, { onError: () => setMigrateError('迁移旧错题失败，请重试') });
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <ErrorState
          title="复习数据加载失败"
          description="暂时无法获取今日复习队列，请检查网络后重试。"
          onRetry={retry}
        />
      </div>
    );
  }

  // Loading never falls through to the empty state (R2): both queries gate here.
  if (isLoading) {
    return <ReviewCardSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <ReviewMetricsStrip metrics={metrics} />

      {!hasMore ? (
        <EmptyState
          icon={<EmptyIllustration name="empty-done" />}
          title="今日复习已完成"
          description="所有到期卡片都复习完毕，明天继续加油。"
        />
      ) : (
        <>
          {gradeError && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              {gradeError}
            </p>
          )}
          {current && (
            <ReviewCardView
              key={current.id}
              item={current}
              leaving={leavingId === current.id}
              locked={locked}
              onGrade={handleGrade}
            />
          )}
        </>
      )}

      {/* Secondary action lives at the bottom so it never competes with the
          daily flow (design §4.6). */}
      <div className="flex flex-col items-end gap-2 border-t border-border pt-3">
        {migrateError && (
          <p role="alert" className="text-xs text-destructive">
            {migrateError}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMigrate}
          disabled={migrate.isPending}
          className="min-h-[44px]"
        >
          <RotateCcw className={cn('size-4', migrate.isPending && 'animate-spin')} />
          {migrate.isPending ? '迁移中...' : '迁移旧错题'}
        </Button>
      </div>
    </div>
  );
}
