import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { auth, reset } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {auth.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {auth.user.nickname || auth.user.email}
            </span>
            <button
              type="button"
              onClick={() => {
                reset();
                window.location.href = '/login';
              }}
              className="text-sm text-muted-foreground transition-colors hover:text-destructive"
            >
              {t('auth.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
