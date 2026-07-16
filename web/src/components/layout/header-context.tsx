import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Header, type HeaderProps } from './header';

interface HeaderConfig {
  /** Override the title set by the active page. Optional — pages usually set this via `useSetHeader`. */
  title?: string;
  subtitle?: HeaderProps['subtitle'];
  actions?: HeaderProps['actions'];
  onBack?: HeaderProps['onBack'];
  /** When true, suppresses the sidebar trigger entirely (e.g. full-screen reader view). */
  hideSidebarTrigger?: boolean;
}

interface HeaderContextValue {
  setHeader: (config: HeaderConfig | null) => void;
  /** Sidebar mobile-drawer trigger — called by Header on hamburger press. */
  openSidebar: () => void;
}

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function useAppHeader() {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error('useAppHeader must be used inside <HeaderProvider>');
  return ctx;
}

/**
 * Mount inside an authenticated layout, together with the `<Header />` visual.
 *
 *   <HeaderContextProvider openSidebar={() => setSidebarOpen(true)}>
 *     <Header />
 *     <Outlet />
 *   </HeaderContextProvider>
 *
 * Pages push their title / actions via `useSetHeader({ title: '…', actions: <>…</> })`.
 * Header re-renders on every change so the same sticky bar reflects whichever page is mounted.
 */
export function HeaderContextProvider({
  openSidebar,
  children,
}: {
  openSidebar: () => void;
  children: ReactNode;
}) {
  const [config, setConfig] = useState<HeaderConfig | null>(null);

  const api = useMemo<HeaderContextValue>(
    () => ({
      setHeader: setConfig,
      openSidebar,
    }),
    [openSidebar],
  );

  return (
    <HeaderContext.Provider value={api}>
      {/* Header rendered once at the layout level — it reads its config via context. */}
      {config && (
        <Header
          title={config.title ?? ''}
          subtitle={config.subtitle}
          actions={config.actions}
          onBack={config.onBack}
          {...(config.hideSidebarTrigger ? {} : { onOpenSidebar: openSidebar })}
        />
      )}
      {children}
    </HeaderContext.Provider>
  );
}

/**
 * Page-level helper: declare what this page's Header should look like.
 * Cleared automatically when the page unmounts (covers navigation between routes).
 *
 *   useSetHeader({ title: '错题本', actions: <Badge>{count} 道</Badge> });
 */
export function useSetHeader(config: HeaderConfig | null) {
  const { setHeader } = useAppHeader();
  // Stabilise the serialized config so we don't loop when consumers pass inline JSX.
  const stable = useMemo(
    () => config,
    [
      config?.title,
      config?.subtitle,
      config?.onBack,
      config?.hideSidebarTrigger,
      // `actions` is ReactNode; identity comparison only — pages should memoise if it changes
      // per render to avoid header thrash.
      config?.actions,
    ],
  );
  useEffect(() => {
    setHeader(stable);
    return () => setHeader(null);
  }, [stable, setHeader]);
}
