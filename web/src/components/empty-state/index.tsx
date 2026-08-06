import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyIllustration, type EmptyIllustrationName } from './empty-illustration';

export { EmptyIllustration };
export type { EmptyIllustrationName };

export interface EmptyStateProps {
  /** Optional icon — pass an inline <svg /> so callers control the visual. */
  icon?: React.ReactNode;
  /** Preferred over `icon` when both are passed. */
  illustration?: React.ReactNode;
  /** Headline shown to the user */
  title: string;
  /** Supporting copy below the title */
  description?: string;
  /** Optional CTA label. Pairs with onAction. */
  actionLabel?: string;
  /** Optional CTA handler */
  onAction?: () => void;
  /** Optional extra class names for the root */
  className?: string;
}

/**
 * Reusable empty / no-data state.
 * Used by quiz / wrong-questions / stats and any other surface that
 * needs a friendly nudge to take the next step.
 */
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const visual = illustration ?? icon;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center',
        className,
      )}
    >
      {visual ? <div className="text-muted-foreground/60">{visual}</div> : null}
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
