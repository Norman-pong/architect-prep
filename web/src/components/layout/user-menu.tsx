import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';
import { MoonIcon, SunIcon } from '@/components/ui/icon';

interface UserMenuProps {
  /** When true, render only the avatar trigger (no name/email). Mobile drawer use. */
  compact?: boolean;
}

/**
 * Sidebar user menu: avatar trigger + dropdown containing email,
 * theme toggle, and logout. Matches newapi / AI-chat style.
 */
export function UserMenu({ compact = false }: UserMenuProps) {
  const { t } = useTranslation();
  const { auth, reset } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!auth.user) return null;

  const display = auth.user.nickname || auth.user.email;
  const initial = display.slice(0, 1).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('auth.userMenu')}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
          'text-sidebar-foreground hover:bg-sidebar-accent/50',
        )}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          aria-hidden
        >
          {initial}
        </span>
        {!compact && (
          <span className="min-w-0 flex-1 truncate text-left">
            <span className="block truncate">{auth.user.nickname || '未设置昵称'}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg',
            compact ? 'bottom-full left-full ml-2 mb-1' : 'bottom-full left-0 mb-1',
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">
              {auth.user.nickname || '未设置昵称'}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{auth.user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleTheme();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            <span>{isDark ? '切换到浅色' : '切换到深色'}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              reset();
              setOpen(false);
              void navigate({ to: '/login' });
            }}
            className="block w-full border-t border-border px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
