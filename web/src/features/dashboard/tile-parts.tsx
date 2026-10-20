import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/error-state';

interface TileErrorProps {
  onRetry?: () => void;
  className?: string;
}

/** Compact error state sized to sit inside a bento tile. */
export function TileError({ onRetry, className }: TileErrorProps) {
  return (
    <ErrorState
      compact
      onRetry={onRetry}
      className={cn('h-full justify-center border-0 bg-transparent px-2 py-4', className)}
    />
  );
}

interface TileSkeletonProps {
  /** Extra lines of text placeholders below the leading block. */
  lines?: number;
  className?: string;
}

/** Accessible loading placeholder used by bento tiles. */
export function TileSkeleton({ lines = 2, className }: TileSkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-3 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}

interface ProgressRingProps {
  /** 0..100 */
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
  label?: string;
}

/** Small ring gauge used inside compact stat tiles. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  children,
  className,
  label = '进度',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} ${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-primary transition-all"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
        {children ?? `${clamped}%`}
      </div>
    </div>
  );
}
