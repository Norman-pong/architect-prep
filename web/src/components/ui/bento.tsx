import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
import { cn } from '@/lib/utils';

// ─── Bento layout primitives ───────────────────────────────────────────
// Pure CSS-grid layout (mobile 2 cols, md+ 6 cols). No shadows by default;
// only interactive tiles get hover elevation. See
// docs/spec/2026-10-20-bento-layout-interaction-design.md §3.
// ────────────────────────────────────────────────────────────────────────

export type BentoSize = 'hero' | 'wide' | 'half' | 'third' | 'stat';
export type BentoTone = 'default' | 'hero';
export type BentoMinH = 'stat' | 'third' | 'half' | 'hero' | 'wide';

const SIZE_CLASSES: Record<BentoSize, string> = {
  hero: 'col-span-2 md:col-span-4',
  wide: 'col-span-2 md:col-span-4',
  half: 'col-span-2 md:col-span-3',
  third: 'col-span-2 md:col-span-2',
  stat: 'col-span-1 md:col-span-2',
};

const MIN_H_CLASSES: Record<BentoMinH, string> = {
  stat: 'min-h-24',
  third: 'min-h-32',
  half: 'min-h-40',
  hero: 'min-h-48',
  wide: 'min-h-[240px]',
};

const DEFAULT_MIN_H: Record<BentoSize, BentoMinH> = {
  hero: 'hero',
  wide: 'wide',
  half: 'half',
  third: 'third',
  stat: 'stat',
};

const PADDING_CLASSES: Record<BentoSize, string> = {
  hero: 'p-5 md:p-6',
  wide: 'p-5',
  half: 'p-5',
  third: 'p-4',
  stat: 'p-4',
};

const TONE_CLASSES: Record<BentoTone, string> = {
  default: 'border-border bg-card',
  hero: 'border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
};

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Grid container: 2 columns on mobile, 6 columns from md upward. */
export function BentoGrid({ className, ...props }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4', className)} {...props} />
  );
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Column span preset (see design doc §3.3). Defaults to 'third'. */
  size?: BentoSize;
  /** Surface tone. Defaults to 'default'. */
  tone?: BentoTone;
  /** Minimum height preset. Defaults to the value associated with `size`. */
  minH?: BentoMinH;
}

function surfaceClasses(size: BentoSize, tone: BentoTone, minH: BentoMinH | undefined): string {
  return cn(
    'relative flex flex-col overflow-hidden rounded-xl border text-card-foreground',
    SIZE_CLASSES[size],
    MIN_H_CLASSES[minH ?? DEFAULT_MIN_H[size]],
    PADDING_CLASSES[size],
    TONE_CLASSES[tone],
  );
}

function HeroAccent({ tone }: { tone: BentoTone }) {
  return tone === 'hero' ? (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary" />
  ) : null;
}

/** Static bento tile. Renders an <article>; never nests another Card. */
export const BentoCard = React.forwardRef<HTMLElement, BentoCardProps>(function BentoCard(
  { size = 'third', tone = 'default', minH, className, children, ...props },
  ref,
) {
  return (
    <article
      ref={ref as React.Ref<HTMLElement>}
      className={cn(surfaceClasses(size, tone, minH), className)}
      {...props}
    >
      <HeroAccent tone={tone} />
      {children}
    </article>
  );
});

export interface BentoLinkCardProps extends BentoCardProps {
  /**
   * Element to compose the tile onto. Must be an anchor/<Link>; buttons are not
   * supported because their content model forbids block-level children.
   */
  render: React.ReactElement;
}

/**
 * Clickable bento tile. The whole tile is one focusable element; do not place
 * nested interactive elements inside (render the CTA as a visual-only element).
 */
export function BentoLinkCard({
  render,
  size = 'third',
  tone = 'default',
  minH,
  className,
  children,
  ...props
}: BentoLinkCardProps) {
  if (import.meta.env.DEV) {
    const renderProps = render.props as { to?: unknown; href?: unknown } | undefined;
    if (!renderProps || (renderProps.to === undefined && renderProps.href === undefined)) {
      console.warn(
        '[BentoLinkCard] render must be an anchor/<Link>; buttons are not valid whole-tile links.',
      );
    }
  }
  return useRender({
    render,
    defaultTagName: 'a',
    props: {
      ...props,
      className: cn(
        surfaceClasses(size, tone, minH),
        'group no-underline transition-[transform,box-shadow] duration-200',
        'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]',
        'animate-fadeIn',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      ),
      children: (
        <>
          <HeroAccent tone={tone} />
          {children}
        </>
      ),
    },
  });
}
