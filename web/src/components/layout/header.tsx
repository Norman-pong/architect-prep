import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  /** Page title — required. Always rendered as the page's h1 (mobile and desktop);
   *  the permanent desktop sidebar labels the section but does not replace it. */
  title: string;
  /** Optional secondary line. Desktop-only (`hidden md:inline`) so it never
   *  duplicates in-page mobile information (e.g. Quiz PageHero progress). */
  subtitle?: string;
  /** When provided, renders a back arrow instead of the sidebar hamburger on mobile. */
  onBack?: () => void;
  /** Mobile-only sidebar trigger (left-drawer with main nav). When `onBack` is also set,
   *  `onBack` wins so the back chevron takes the leftmost slot. */
  onOpenSidebar?: () => void;
  /** Right-side actions (search button, theme toggle, etc.). Rendered identically on
   *  mobile and desktop. */
  actions?: ReactNode;
}

/**
 * Unified top header for all authenticated pages.
 *
 * Layout rules (per docs/architecture/mobile-learning-design.md §1.1, §1.7):
 *  - Mobile (<768px): h-12, sticky top-0, hamburger (or back chevron) + title + actions.
 *    The subtitle is hidden so pages can surface the same information closer to the
 *    content (e.g. Quiz/Review PageHero) without double-rendering it.
 *  - Desktop (≥768px): h-16, sticky top-0, left-aligned title + subtitle + actions.
 *    No hamburger — sidebar is permanently visible on the left.
 *  - Touch targets ≥44×44px on every interactive slot.
 */
export function Header({ title, subtitle, onBack, onOpenSidebar, actions }: HeaderProps) {
  const { t } = useTranslation();
  // Mobile leftmost button: back arrow wins over hamburger when both provided.
  const showBack = !!onBack;
  const showHamburger = !showBack && !!onOpenSidebar;

  return (
    <header
      className={cn(
        'sticky top-0 z-sticky flex shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md',
        'h-12 md:h-16',
      )}
    >
      {/* Left: back or hamburger (mobile) — desktop has no left slot (sidebar is permanent). */}
      <div className="flex w-11 shrink-0 items-center md:hidden">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t('a11y.back')}
            className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {showHamburger && (
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label={t('a11y.openMenu')}
            className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          >
            <MenuIcon className="size-5" />
          </button>
        )}
      </div>

      {/* Title + desktop-only subtitle, left-aligned on one baseline (I-9). */}
      <div className="flex min-w-0 flex-1 flex-col justify-center md:flex-row md:items-baseline md:justify-start md:gap-2">
        <h1 className="truncate text-base font-semibold text-foreground md:text-lg">{title}</h1>
        {subtitle && (
          <span className="hidden truncate text-sm text-muted-foreground md:inline">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right: page actions (search, theme, etc.). */}
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </header>
  );
}
