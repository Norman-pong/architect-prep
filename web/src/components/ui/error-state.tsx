import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  /** Headline shown to the user. Defaults to a generic load-failure message. */
  title?: string;
  /** Supporting copy below the title. */
  description?: string;
  /** Retry handler. When provided, a retry button is rendered. */
  onRetry?: () => void;
  /** Retry button label. */
  retryLabel?: string;
  /** Denser spacing for use inside cards / small surfaces. */
  compact?: boolean;
  className?: string;
}

/**
 * Reusable query-error state. Pairs with <EmptyState/> so pages can tell
 * "failed to load" apart from "no data" and offer a retry action.
 *
 * Feedback primitives live under components/ui (see AGENTS.md); features
 * only consume this component.
 */
export function ErrorState({
  title = '加载失败',
  description = '数据加载时出现问题，请检查网络后重试。',
  onRetry,
  retryLabel = '重试',
  compact = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 text-center',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2 min-h-11">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
