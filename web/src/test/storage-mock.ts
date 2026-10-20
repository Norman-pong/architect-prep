/**
 * Minimal in-memory Storage for unit tests.
 *
 * The jsdom sandbox used by this project exposes `window` but not
 * `window.localStorage` (its origin is opaque), and Node's experimental
 * global `localStorage` is unavailable without `--localstorage-file`. Tests
 * that exercise persisted stores/session helpers install this mock with
 * `vi.stubGlobal('localStorage', createStorageMock())`.
 */
export function createStorageMock(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map.clear();
    },
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  };
}
