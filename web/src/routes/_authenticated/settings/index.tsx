import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme-store';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('nav.settings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t('theme.light')} / {t('theme.dark')}
          </span>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              {t('theme.light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              {t('theme.dark')}
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              {t('theme.system')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
