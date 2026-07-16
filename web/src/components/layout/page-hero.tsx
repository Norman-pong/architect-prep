import type { ReactNode } from 'react';

export interface PageHeroProps {
  /**
   * Content rendered inside the hero band. Typically the same ReactNode passed as
   * `actions` to `useSetHeader` so the slot above the page (Header) and the band
   * below it (PageHero) share a single source of truth.
   *
   * On desktop the corresponding `Header` action slot is already visible — we
   * hide this band (`md:hidden`) so we don't double-render the same controls.
   */
  children: ReactNode;
  /** Optional subtle background — most pages leave this unset to inherit the surface. */
  bordered?: boolean;
}

/**
 * Mobile-only band that sits between the layout `<Header />` and the page main
 * area. Carries dynamic content (tabs, progress badges, in-page actions) that
 * lives next to the page rather than in the global chrome.
 *
 * Always pair with `useSetHeader({ actions })` so the same actions are also
 * reachable from the Header on desktop.
 */
export function PageHero({ children, bordered = false }: PageHeroProps) {
  if (!children) return null;
  return (
    <div
      className={[
        'md:hidden',
        'flex items-center justify-end gap-2 px-3 py-2',
        bordered ? 'border-b border-border bg-card/40' : '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
