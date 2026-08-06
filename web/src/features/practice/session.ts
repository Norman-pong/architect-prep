import { useCallback, useState } from 'react';
import type { PracticeSession } from './types';

const STORAGE_KEY = 'practice-session';

export function loadSession(): PracticeSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeSession;
    if (!parsed.questions?.length || parsed.currentIndex >= parsed.questions.length) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: PracticeSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage full or unavailable - session won't persist, but in-memory still works
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** React hook that syncs a PracticeSession to localStorage. */
export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSession | null>(() => loadSession());

  const update = useCallback((updater: (prev: PracticeSession) => PracticeSession) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveSession(next);
      return next;
    });
  }, []);

  const start = useCallback((s: PracticeSession) => {
    saveSession(s);
    setSession(s);
  }, []);

  const exit = useCallback(() => {
    setSession((prev) => {
      if (prev) saveSession(prev);
      return prev;
    });
  }, []);

  const finish = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return { session, start, update, exit, finish };
}
