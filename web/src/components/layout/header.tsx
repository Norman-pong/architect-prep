import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { auth, reset } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </Button>

        {auth.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
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
