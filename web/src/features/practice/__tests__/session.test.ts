import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStorageMock } from '@/test/storage-mock';
import { clearSession, loadSession, saveSession } from '../session';
import type { PracticeSession } from '../types';

const STORAGE_KEY = 'practice-session';

function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    questions: [
      {
        id: 1,
        chapter_id: 1,
        content: 'q1',
        options: ['A. one', 'B. two'],
        answer_keys: ['A'],
      },
      {
        id: 2,
        chapter_id: 1,
        content: 'q2',
        options: ['A. one', 'B. two'],
        answer_keys: ['B'],
      },
    ],
    config: { count: 2, scope: 'all' },
    answers: {},
    currentIndex: 0,
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

// The jsdom sandbox has no usable localStorage; install the in-memory mock.
vi.stubGlobal('localStorage', createStorageMock());

describe('practice session lifecycle (F11/F13)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('keeps a saved session, including one the user never answered', () => {
    const session = makeSession();
    saveSession(session);
    const loaded = loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.questions).toHaveLength(2);
    expect(Object.keys(loaded?.answers ?? {})).toHaveLength(0);
  });

  it('restores the answered progress and current index', () => {
    saveSession(
      makeSession({
        answers: {
          1: {
            selected: ['A'],
            result: { is_correct: true, correct_answer_keys: ['A'], explanation: '' },
          },
        },
        currentIndex: 1,
      }),
    );
    const loaded = loadSession();
    expect(loaded?.currentIndex).toBe(1);
    expect(loaded?.answers[1]?.result.is_correct).toBe(true);
  });

  it('drops an exhausted session instead of resurrecting a ghost "continue" card', () => {
    saveSession(makeSession({ currentIndex: 2 }));
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clearSession removes the persisted session (finish flow, F11)', () => {
    saveSession(makeSession());
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('returns null for malformed storage', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    expect(loadSession()).toBeNull();
  });
});
