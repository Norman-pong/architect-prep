import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PracticeStart } from './practice-start';
import { PracticeResults } from './practice-results';
import { QuizRunner } from './quiz-runner';
import { usePracticeSession } from './session';
import type { PracticeScope } from './search';
import type { Question, PracticeSession } from './types';

type Phase = 'start' | 'playing' | 'results';

export interface PracticePageProps {
  /** Preselected scope from the URL contract `/practice?chapter=<id>`. */
  initialScope?: PracticeScope;
}

export function PracticePage({ initialScope = 'all' }: PracticePageProps) {
  const { session, start, update, exit, finish } = usePracticeSession();
  const [phase, setPhase] = useState<Phase>('start');
  // The results view needs its own snapshot: `finish()` clears the persisted
  // session so a refresh can never resurrect a stale "继续练习" card (F11).
  const [finishedSession, setFinishedSession] = useState<PracticeSession | null>(null);
  // Synchronous re-entry guard: mutation state updates are async, so a fast
  // double click could otherwise fire two random-question GETs (F12).
  const startLockRef = useRef(false);
  const [startError, setStartError] = useState('');

  // Fetch random questions on new practice
  const fetchQuestions = useMutation({
    mutationFn: async (params: { count: number; scope: PracticeScope }) => {
      const resp = await api.get('/practice/questions/random', {
        params: {
          count: params.count,
          chapter_id: params.scope === 'all' ? undefined : params.scope,
        },
      });
      return resp.data.data as { items: Question[]; total: number };
    },
  });

  function handleStart(count: number, scope: PracticeScope) {
    // F12: a second click while the request is in flight must be a no-op, not
    // a second GET that silently replaces the question pack.
    if (fetchQuestions.isPending || startLockRef.current) return;
    startLockRef.current = true;
    setStartError('');
    fetchQuestions.mutate(
      { count, scope },
      {
        onSuccess: (data) => {
          // G13: an empty pack must not become a 0-question session.
          if (data.items.length === 0) {
            setStartError('该范围暂无可用题目，请调整章节或题量后重试');
            return;
          }
          const newSession: PracticeSession = {
            questions: data.items,
            config: { count, scope },
            answers: {},
            currentIndex: 0,
            startedAt: new Date().toISOString(),
          };
          start(newSession);
          setPhase('playing');
        },
        onError: () => setStartError('题目加载失败，请重试'),
        onSettled: () => {
          startLockRef.current = false;
        },
      },
    );
  }

  function handleContinue() {
    if (session) setPhase('playing');
  }

  function handleAbandon() {
    finish();
    setPhase('start');
  }

  function handleExit() {
    // Progress is already persisted on every answer; keep it for "继续练习".
    exit();
    setPhase('start');
  }

  function handleFinish() {
    if (!session) return;
    setFinishedSession(session);
    finish();
    setPhase('results');
  }

  function handleRestart() {
    finish();
    setFinishedSession(null);
    setPhase('start');
  }

  if (phase === 'results' && finishedSession) {
    return <PracticeResults session={finishedSession} onRestart={handleRestart} />;
  }

  const isPlaying = phase === 'playing' && session !== null;

  if (!isPlaying) {
    return (
      <PracticeStart
        session={session}
        initialScope={initialScope}
        isStarting={fetchQuestions.isPending}
        startError={startError}
        onStart={handleStart}
        onContinue={handleContinue}
        onAbandon={handleAbandon}
      />
    );
  }

  return (
    <QuizRunner
      session={session}
      onAnswer={(questionId, selected, result) => {
        update((prev) => ({
          ...prev,
          answers: { ...prev.answers, [questionId]: { selected, result } },
        }));
      }}
      onNext={() => {
        update((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      }}
      onExit={handleExit}
      onFinish={handleFinish}
    />
  );
}
