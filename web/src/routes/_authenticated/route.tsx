import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { HeaderContextProvider } from '@/components/layout/header-context';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState();
    if (!auth.user) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openSidebar = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Skip link: first Tab stop, jumps keyboard users past the chrome into the page body.
          Off-screen until focused (translate, not opacity — stays in the a11y tree). */}
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-popover -translate-y-[150%] rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg transition-transform duration-200 ease-out focus:translate-y-0"
      >
        {t('a11y.skipToContent')}
      </a>
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderContextProvider openSidebar={openSidebar}>
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-auto bg-background focus:outline-none md:bg-muted/30"
          >
            {/* Mobile: pt-3 (12px) keeps content off the sticky header without
                feeling crowded; pb reserves the safe-area so the last row is not
                flush with the browser UI. Desktop: p-8 gives breathing room.
                There is deliberately no route-level card surface: bento tiles /
                page cards are the single surface. Pages own their max-width
                (see design doc §3.9: dashboard 6xl, reader 3xl, settings 2xl...). */}
            <div className="mx-auto max-w-6xl px-3 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))] md:p-8">
              <Outlet />
            </div>
          </main>
        </HeaderContextProvider>
      </div>
    </div>
  );
}
