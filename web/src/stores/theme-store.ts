import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  /** Persisted user preference. `system` defers to the OS colour scheme. */
  theme: Theme;
  /**
   * Theme actually applied to <html>. Derived from `theme`, but kept in state
   * so subscribers re-render when the OS scheme changes while theme=system.
   */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;
}

/** Map a preference to the theme that is actually visible right now. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: resolveTheme('system'),
      setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        applyResolvedTheme(resolved);
        set({ theme, resolvedTheme: resolved });
      },
      toggleTheme: () => {
        // Toggle against the *actual* applied theme, not the stored preference:
        // with theme=system + OS dark the first click must turn light (F7).
        const { resolvedTheme } = get();
        get().setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: 'theme-storage',
      // resolvedTheme is derived; persisting it would briefly fight the OS on rehydrate.
      partialize: (state) => ({ theme: state.theme }),
      // Derive resolvedTheme during hydration. `onRehydrateStorage` alone cannot
      // do this: persist hydrates synchronously inside create(), so the outer
      // `useThemeStore` binding is still in TDZ there (R1). `merge` runs before
      // the store is observable, so both fields land in a single update.
      merge: (persistedState, currentState) => {
        const stored = persistedState as { theme?: unknown } | undefined;
        const theme = stored && isTheme(stored.theme) ? stored.theme : currentState.theme;
        return { ...currentState, theme, resolvedTheme: resolveTheme(theme) };
      },
      // Only the callback argument is touched here — no reference to the store.
      onRehydrateStorage: () => (state) => {
        if (state) applyResolvedTheme(state.resolvedTheme);
      },
    },
  ),
);

// No persisted value → onRehydrateStorage receives `undefined`; apply the
// default preference once the store binding exists (safe: no TDZ here).
if (typeof document !== 'undefined') {
  applyResolvedTheme(useThemeStore.getState().resolvedTheme);
}

/** Read the theme that is actually applied (re-renders on OS scheme changes). */
export function useEffectiveTheme(): ResolvedTheme {
  return useThemeStore((state) => state.resolvedTheme);
}

/** Live OS-scheme sync. Returns a cleanup for the matchMedia listener. */
export function startSystemThemeListener(): () => void {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (useThemeStore.getState().theme !== 'system') return;
    const resolved = resolveTheme('system');
    applyResolvedTheme(resolved);
    useThemeStore.setState({ resolvedTheme: resolved });
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

// One listener for the app lifetime (the store itself is a module singleton).
// HMR disposes it before re-evaluating this module, so no duplicate listeners.
if (typeof window !== 'undefined') {
  const teardown = startSystemThemeListener();
  import.meta.hot?.dispose(teardown);
}
