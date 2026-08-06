// web/src/components/ui/skeleton.tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Width in px or any CSS length string. Defaults per variant. */
  w?: number | string;
  /** Height in px or any CSS length string. Defaults per variant. */
  h?: number | string;
  /** Border-radius in px. Defaults per variant. */
  r?: number | string;
}

/**
 * Loading placeholder. Shimmer keyframe is consumed via the `animate-shimmer`
 * utility (defined in `styles/index.css`); the reduced-motion media query
 * collapses the keyframe to a static state automatically.
 */
export function Skeleton({ variant = 'text', w, h, r, className, style, ...rest }: SkeletonProps) {
  const defaults = {
    text: { w: '100%', h: 16, r: 4 },
    rect: { w: '100%', h: 16, r: 4 },
    circle: { w: 40, h: 40, r: 9999 },
  }[variant];

  const finalW = w ?? defaults.w;
  const finalH = h ?? defaults.h;
  const finalR = r ?? defaults.r;

  // r is a number for our preset values; if a string is passed we treat it as a custom
  // class and fall back to rounded-md (the implementer can override via className).
  const radiusNum = typeof finalR === 'number' ? finalR : 6;
  const radiusClass =
    radiusNum === 9999
      ? 'rounded-full'
      : radiusNum <= 4
        ? 'rounded'
        : radiusNum <= 6
          ? 'rounded-md'
          : radiusNum <= 12
            ? 'rounded-lg'
            : 'rounded-xl';

  return (
    <div
      role="status"
      aria-label="加载中"
      className={cn(
        'shrink-0 animate-shimmer bg-muted/60 bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]',
        radiusClass,
        variant === 'circle' && 'rounded-full',
        className,
      )}
      style={{
        width: typeof finalW === 'number' ? `${finalW}px` : finalW,
        height: typeof finalH === 'number' ? `${finalH}px` : finalH,
        ...style,
      }}
      {...rest}
    />
  );
}
