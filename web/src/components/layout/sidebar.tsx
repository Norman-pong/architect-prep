import { useTranslation } from 'react-i18next';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'nav.knowledge', path: '/knowledge', icon: '\uD83D\uDCDA' },
  { key: 'nav.practice', path: '/practice', icon: '\u270F\uFE0F' },
  { key: 'nav.wrongQuestions', path: '/wrong-questions', icon: '\u274C' },
  { key: 'nav.stats', path: '/stats', icon: '\uD83D\uDCCA' },
  { key: 'nav.settings', path: '/settings', icon: '\u2699\uFE0F' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <span className="text-lg font-bold text-sidebar-foreground">{t('app.title')}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
              )}
            >
              <span className="text-base">{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
