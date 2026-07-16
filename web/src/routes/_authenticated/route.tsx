import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const openSidebar = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderContextProvider openSidebar={openSidebar}>
          <main className="flex-1 overflow-auto bg-background md:bg-muted/30">
            <div className="mx-auto max-w-5xl md:p-8">
              {/* Mobile: no card wrapper — content uses the page padding directly. */}
              {/* Desktop: single white card with rounded corners + shadow (newapi style). */}
              <div className="md:rounded-xl md:border md:border-border md:bg-card md:p-6 md:shadow-sm">
                <Outlet />
              </div>
            </div>
          </main>
        </HeaderContextProvider>
      </div>
    </div>
  );
}
