import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/layout/page-hero';
import { useSetHeader } from '@/components/layout/header-context';
import { QuizSkeleton } from './quiz-skeleton';
import { QuizOption } from './quiz-option';
import { QuizResult } from './quiz-result';
import { PracticeStart } from './practice-start';
import { PracticeResults } from './practice-results';
import { usePracticeSession } from './session';
import type { Question, SubmitResponse, PracticeSession } from './types';

type Phase = 'idle' | 'playing' | 'finished';

export function PracticePage() {
  const { session, start, update, exit, finish } = usePracticeSession();
  const [phase, setPhase] = useState<Phase>(() =>
    session && session.currentIndex < session.questions.length ? 'idle' : 'idle',
  );

  // Fetch random questions on new practice
  const fetchQuestions = useMutation({
    mutationFn: async (params: { count: number; scope: 'all' | number }) => {
      const resp = await api.get('/practice/questions/random', {
        params: {
          count: params.count,
          chapter_id: params.scope === 'all' ? undefined : params.scope,
        },
      });
      return resp.data.data as { items: Question[]; total: number };
    },
  });

  function handleStart(count: number, scope: 'all' | number) {
    fetchQuestions.mutate(
      { count, scope },
      {
        onSuccess: (data) => {
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
      },
    );
  }

  function handleContinue() {
    if (session) setPhase('playing');
  }

  function handleAbandon() {
    finish();
  }

  function handleExit() {
    exit();
    setPhase('idle');
  }

  function handleFinish() {
    setPhase('finished');
  }

  function handleRestart() {
    finish();
    setPhase('idle');
  }

  if (phase === 'idle') {
    return (
      <PracticeStart
        session={session}
        onStart={handleStart}
        onContinue={handleContinue}
        onAbandon={handleAbandon}
      />
    );
  }

  if (phase === 'finished' && session) {
    return <PracticeResults session={session} onRestart={handleRestart} />;
  }

  // phase === 'playing'
  if (!session) {
    return (
      <PracticeStart
        session={null}
        onStart={handleStart}
        onContinue={handleContinue}
        onAbandon={handleAbandon}
      />
    );
  }

  if (fetchQuestions.isPending) return <QuizSkeleton />;

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

// ── Quiz Runner ────────────────────────────────────────

interface QuizRunnerProps {
  session: PracticeSession;
  onAnswer: (questionId: number, selected: string[], result: SubmitResponse) => void;
  onNext: () => void;
  onExit: () => void;
  onFinish: () => void;
}

function QuizRunner({ session, onAnswer, onNext, onExit, onFinish }: QuizRunnerProps) {
  const queryClient = useQueryClient();
  const questions = session.questions;
  const currentIndex = session.currentIndex;
  const currentQuestion = questions[currentIndex];

  const existingAnswer = currentQuestion ? session.answers[currentQuestion.id] : undefined;
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    () => new Set(existingAnswer?.selected ?? []),
  );
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(
    () => existingAnswer?.result ?? null,
  );

  // Sync local state when question changes
  const [lastSyncedId, setLastSyncedId] = useState<number | null>(null);
  if (currentQuestion && currentQuestion.id !== lastSyncedId) {
    const ans = session.answers[currentQuestion.id];
    setSelectedOptions(new Set(ans?.selected ?? []));
    setSubmitResult(ans?.result ?? null);
    setLastSyncedId(currentQuestion.id);
  }

  const isMultiple = currentQuestion?.question_type === 'multiple';
  const isLast = currentIndex >= questions.length - 1;

  useSetHeader({
    title: '刷题练习',
    subtitle: `${currentIndex + 1} / ${questions.length}`,
  });

  const submitMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as SubmitResponse;
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      onAnswer(currentQuestion.id, Array.from(selectedOptions).sort(), data);
      void queryClient.invalidateQueries({ queryKey: ['practice-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['wrong-questions'] });
    },
  });

  function toggleOption(key: string) {
    if (submitResult) return;
    const next = new Set(selectedOptions);
    if (isMultiple) {
      if (next.has(key)) next.delete(key);
      else next.add(key);
    } else {
      next.clear();
      next.add(key);
    }
    setSelectedOptions(next);
  }

  function handleSubmit() {
    if (!currentQuestion || selectedOptions.size === 0) return;
    submitMutation.mutate({
      question_id: currentQuestion.id,
      answer_keys: Array.from(selectedOptions).sort(),
    });
  }

  function handleNext() {
    if (isLast) {
      onFinish();
      return;
    }
    onNext();
  }

  const progressPct = ((currentIndex + (submitResult ? 1 : 0)) / questions.length) * 100;

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-muted-foreground">题目已用完</p>
        <Button className="mt-4" onClick={onFinish}>
          查看结果
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar + exit */}
      <PageHero>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="px-3 py-1 text-sm">
            {currentIndex + 1} / {questions.length}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onExit}>
            <LogOut className="mr-1 size-3.5" />
            退出
          </Button>
        </div>
      </PageHero>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {isMultiple ? (
              <Badge variant="warning" className="gap-1">
                <span
                  className="inline-block size-2 rounded-sm border-2 border-current"
                  aria-hidden
                />
                多选
              </Badge>
            ) : (
              <Badge variant="info" className="gap-1">
                <span
                  className="inline-block size-2 rounded-full border-2 border-current"
                  aria-hidden
                />
                单选
              </Badge>
            )}
            {currentQuestion.difficulty != null && (
              <Badge variant="secondary" className="gap-1">
                难度 {currentQuestion.difficulty}
              </Badge>
            )}
          </div>
          <CardTitle className="mt-2 text-base leading-relaxed">
            {currentQuestion.content}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(currentQuestion.options ?? []).map((opt) => {
            const key = opt.charAt(0);
            const isSelected = selectedOptions.has(key);
            const isCorrect = submitResult?.correct_answer_keys.includes(key) ?? false;
            const isWrongSelected = !!submitResult && isSelected && !isCorrect;
            return (
              <QuizOption
                key={opt}
                letterKey={key}
                label={opt}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isWrongSelected={isWrongSelected}
                showResult={!!submitResult}
                disabled={!!submitResult}
                onToggle={toggleOption}
              />
            );
          })}
        </CardContent>
      </Card>

      {submitResult && <QuizResult result={submitResult} />}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!submitResult ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0 || submitMutation.isPending}
          >
            {submitMutation.isPending ? '提交中...' : '提交答案'}
          </Button>
        ) : (
          <Button variant="outline" onClick={handleNext}>
            {isLast ? '完成练习' : '下一题'}
          </Button>
        )}
      </div>
    </div>
  );
}
