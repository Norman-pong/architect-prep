import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStorageMock } from '@/test/storage-mock';

// ─── matchMedia harness (installed before the store module is evaluated) ───
let mediaMatches = true;
type MediaListener = (event: { matches: boolean }) => void;
const mediaListeners = new Set<MediaListener>();

vi.stubGlobal(
  'matchMedia',
  (query: string): MediaQueryList =>
    ({
      matches: mediaMatches,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: MediaListener) => {
        mediaListeners.add(listener);
      },
      removeEventListener: (_type: string, listener: MediaListener) => {
        mediaListeners.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList,
);

// The jsdom sandbox has no usable localStorage; install the in-memory mock
// before the store module (whose persist middleware reads it) is evaluated.
vi.stubGlobal('localStorage', createStorageMock());

const { useThemeStore, resolveTheme, startSystemThemeListener } =
  await import('@/stores/theme-store');

function emitSystemScheme(matches: boolean) {
  mediaMatches = matches;
  for (const listener of Array.from(mediaListeners)) listener({ matches });
}

describe('theme-store (F7/F8)', () => {
  beforeEach(() => {
    mediaMatches = true;
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ theme: 'system', resolvedTheme: 'light' });
  });

  it('resolves the actual applied theme for system preference', () => {
    mediaMatches = true;
    expect(resolveTheme('system')).toBe('dark');
    mediaMatches = false;
    expect(resolveTheme('system')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
  });

  it('toggleTheme flips against the actual theme when system=dark (F7)', () => {
    mediaMatches = true;
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    // system + OS dark must go light on the first click, not stay dark.
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleTheme does not get stuck when the OS is light while system selected', () => {
    mediaMatches = false;
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies OS scheme changes live while theme=system (F8)', () => {
    mediaMatches = false;
    useThemeStore.getState().setTheme('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    emitSystemScheme(true);
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    emitSystemScheme(false);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('ignores OS scheme changes when an explicit theme is selected', () => {
    useThemeStore.getState().setTheme('light');
    emitSystemScheme(true);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('startSystemThemeListener registers a removable listener', () => {
    const before = mediaListeners.size;
    const teardown = startSystemThemeListener();
    expect(mediaListeners.size).toBe(before + 1);
    teardown();
    expect(mediaListeners.size).toBe(before);
  });
});
