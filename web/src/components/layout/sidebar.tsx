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
  SettingsIcon,
} from '@/components/ui/icon';

import type { IconProps } from '@/components/ui/icon';

type NavItem = {
  key: string;
  path: string;
  icon: React.ComponentType<IconProps>;
};

const navItems: readonly NavItem[] = [
  { key: 'nav.knowledge', path: '/knowledge', icon: BookOpenIcon },
  { key: 'nav.practice', path: '/practice', icon: PencilIcon },
  { key: 'nav.wrongQuestions', path: '/wrong-questions', icon: AlertCircleIcon },
  { key: 'nav.stats', path: '/stats', icon: BarChartIcon },
  { key: 'nav.settings', path: '/settings', icon: SettingsIcon },
] as const;

export interface SidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onNavigate, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
          'flex w-60 flex-col border-r border-sidebar-border bg-sidebar',
          // Mobile: fixed drawer that slides in/out
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:flex',
        )}
      >
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

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(`${item.path}/`);
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
        </nav>
      </aside>
    </>
  );
}