import { cn } from '@/lib/utils';

export type EmptyIllustrationName = 'empty-questions' | 'empty-wrong' | 'empty-done';

export interface EmptyIllustrationProps {
  name: EmptyIllustrationName;
  className?: string;
}

/**
 * Three pre-defined muted SVG illustrations for empty states. Inherits
 * `currentColor` so the caller (typically <EmptyState/> wrapper with
 * `text-muted-foreground/60`) controls the color via Tailwind class.
 */
export function EmptyIllustration({ name, className }: EmptyIllustrationProps) {
  if (name === 'empty-questions') {
    return (
      <svg
        className={cn('h-12 w-12', className)}
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="12" y="8" width="40" height="48" rx="4" />
        <path d="M20 22h24M20 32h24M20 42h16" />
        <circle cx="48" cy="48" r="8" fill="currentColor" opacity="0.3" />
        <path d="M44 48l3 3 6-6" />
      </svg>
    );
  }
  if (name === 'empty-wrong') {
    return (
      <svg
        className={cn('h-12 w-12', className)}
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="22" />
        <path d="M22 22l20 20M42 22l-20 20" />
      </svg>
    );
  }
  // empty-done
  return (
    <svg
      className={cn('h-12 w-12', className)}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="22" />
      <path d="M22 33l8 8 14-16" />
    </svg>
  );
}
