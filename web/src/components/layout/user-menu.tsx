import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore, type Theme } from '@/stores/theme-store';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  /** When true, render only the avatar trigger (no name/email). Mobile drawer use. */
  compact?: boolean;
}

const THEME_OPTIONS: {
  value: Theme;
  icon: typeof Sun;
  labelKey: 'theme.light' | 'theme.dark' | 'theme.system';
}[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
];

/**
 * Sidebar user menu: avatar trigger + dropdown containing email,
 * theme preference (light / dark / follow system) and logout.
 *
 * Theme state comes from `useThemeStore` — the same single source as the
 * Settings page — so the checked option always matches the applied theme,
 * including when the OS scheme changes while "follow system" is active (F8).
 */
export function UserMenu({ compact = false }: UserMenuProps) {
  const { t } = useTranslation();
  const { auth, reset } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Logout mirrors the Settings page (V12): confirm first, then drop the
  // previous user's cached query data so a different account never reads it.
  const handleLogout = React.useCallback(() => {
    reset();
    queryClient.clear();
    void navigate({ to: '/login' });
  }, [reset, queryClient, navigate]);

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
          'flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
          'text-sidebar-foreground hover:bg-sidebar-accent/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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
            'absolute z-popover w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg',
            compact ? 'bottom-full left-full ml-2 mb-1' : 'bottom-full left-0 mb-1',
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">
              {auth.user.nickname || '未设置昵称'}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{auth.user.email}</p>
          </div>

          {/* Theme preference: all three states stay reachable from the menu,
              matching the Settings page (F8: no more light/dark-only asymmetry). */}
          <div
            className="border-b border-border py-1"
            role="group"
            aria-label={t('a11y.themeOptions')}
          >
            {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(value);
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <Icon size={16} aria-hidden />
                  <span className="flex-1">{t(labelKey)}</span>
                  {active && <Check size={16} className="text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setLogoutOpen(true);
            }}
            className="block min-h-11 w-full border-t border-border px-4 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            {t('auth.logout')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="确认登出?"
        description="登出后将清空本地缓存,需要重新使用邮箱登录"
        confirmLabel="登出"
        cancelLabel="取消"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </div>
  );
}
