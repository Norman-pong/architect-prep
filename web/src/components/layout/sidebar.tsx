import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  AlertCircleIcon,
  BarChartIcon,
  BookOpenIcon,
  CloseIcon,
  PencilIcon,
  ReviewIcon,
  SettingsIcon,
} from '@/components/ui/icon';
import { useAuthStore } from '@/stores/auth-store';
import { UserMenu } from './user-menu';

import type { IconProps } from '@/components/ui/icon';

type NavItem = {
  key: string;
  path: string;
  icon: React.ComponentType<IconProps>;
};

type NavGroup = {
  label?: string;
  items: readonly NavItem[];
};

// Group nav so the auth route (review/knowledge/practice/wrong-questions) lives
// above the personal route (stats/settings), mirroring the newapi sidebar layout.
const navGroups: readonly NavGroup[] = [
  {
    items: [
      { key: 'nav.review', path: '/review', icon: ReviewIcon },
      { key: 'nav.knowledge', path: '/knowledge', icon: BookOpenIcon },
      { key: 'nav.practice', path: '/practice', icon: PencilIcon },
      { key: 'nav.wrongQuestions', path: '/wrong-questions', icon: AlertCircleIcon },
    ],
  },
  {
    label: '常规',
    items: [
      { key: 'nav.stats', path: '/stats', icon: BarChartIcon },
      { key: 'nav.settings', path: '/settings', icon: SettingsIcon },
    ],
  },
];

export interface SidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export function Sidebar({ mobileOpen = false, onNavigate, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();
  const { auth } = useAuthStore();

  // Close the mobile drawer on Escape (matches the backdrop click affordance).
  React.useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile, mobileOpen, onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        aria-label="Primary navigation"
        className={cn(
          // B-011: h-full makes the flex column stretch to the parent
          // h-screen so the nav (flex-1) can push the user block to the
          // bottom. Without h-full the aside collapses to auto-height and
          // the user card sits wherever the nav ends.
          'flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar',
          // Mobile: fixed drawer that slides in/out
          'fixed inset-y-0 left-0 z-[60] transform transition-transform duration-200 ease-out md:static md:translate-x-0',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full pointer-events-none md:pointer-events-auto',
          'md:flex',
        )}
        inert={isMobile && !mobileOpen ? true : undefined}
        aria-hidden={isMobile && !mobileOpen ? true : undefined}
      >
        {/* Brand row */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <span className="text-lg font-bold text-sidebar-foreground">{t('app.title')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.label && (
                <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-primary transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Icon
                      size={18}
                      className={cn(
                        isActive
                          ? 'text-primary'
                          : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground',
                      )}
                    />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User info (sticky to bottom thanks to nav flex-1 above). The
            border-t + padding echoes the chat-app style. */}
        {auth.user && (
          <div className="border-t border-sidebar-border p-3">
            <UserMenu />
          </div>
        )}
      </aside>
    </>
  );
}
