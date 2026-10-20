import { describe, expect, it, vi } from 'vite-plus/test';
import { createStorageMock } from '@/test/storage-mock';

// ─── matchMedia + localStorage harness (must be installed before import) ───
let mediaMatches = true;
vi.stubGlobal(
  'matchMedia',
  (query: string): MediaQueryList =>
    ({
      matches: mediaMatches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList,
);

const storage = createStorageMock();
storage.setItem('theme-storage', JSON.stringify({ state: { theme: 'dark' }, version: 0 }));
vi.stubGlobal('localStorage', storage);

// R1: the store hydrates synchronously during module evaluation. Importing after
// the persisted value is in place is the only way to exercise that path.
const { useThemeStore } = await import('@/stores/theme-store');

describe('theme-store hydration (R1)', () => {
  it('derives resolvedTheme from the persisted preference', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('applies the hydrated theme to the document class', () => {
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('marks the persist middleware as hydrated', () => {
    expect(useThemeStore.persist.hasHydrated()).toBe(true);
  });

  it('keeps resolvedTheme consistent when the OS is light', () => {
    mediaMatches = false;
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    // Restore for the persisted 'dark' expectation of later assertions.
    useThemeStore.getState().setTheme('dark');
  });
});
