import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { MenuIcon, MoonIcon, SunIcon } from '@/components/ui/icon';

export interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { auth, reset } = useAuthStore();

  // Header's theme display mirrors the resolved (effective) theme so the icon
  // always matches what the user is actually looking at.
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden"
        >
          <MenuIcon size={20} />
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </Button>

        {auth.user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {auth.user.nickname || auth.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                window.location.href = '/login';
              }}
            >
              {t('auth.logout')}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}