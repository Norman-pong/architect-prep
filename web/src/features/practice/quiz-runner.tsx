import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/layout/page-hero';
import { useSetHeader } from '@/components/layout/header-context';
import { QuizOption } from './quiz-option';
import { QuizResult } from './quiz-result';
import { practiceKeys } from './queries';
import type { SubmitResponse, PracticeSession } from './types';

export interface QuizRunnerProps {
  session: PracticeSession;
  onAnswer: (questionId: number, selected: string[], result: SubmitResponse) => void;
  onNext: () => void;
  onExit: () => void;
  onFinish: () => void;
}

export function QuizRunner({ session, onAnswer, onNext, onExit, onFinish }: QuizRunnerProps) {
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

  // Desktop exit lives in the Header action slot; mobile keeps the PageHero
  // copy below. The wrapper is `hidden md:flex` so the two never double-render
  // on the same viewport (F9).
  const headerActions = useMemo(
    () => (
      <div className="hidden items-center md:flex">
        <Button variant="ghost" size="md" onClick={onExit} className="min-h-[44px]">
          <LogOut className="size-4" aria-hidden />
          退出
        </Button>
      </div>
    ),
    [onExit],
  );

  useSetHeader({
    title: '刷题练习',
    subtitle: `${currentIndex + 1} / ${questions.length}`,
    actions: headerActions,
  });

  const submitMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as SubmitResponse;
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      if (!currentQuestion) return;
      onAnswer(currentQuestion.id, Array.from(selectedOptions).sort(), data);
      void queryClient.invalidateQueries({ queryKey: practiceKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: practiceKeys.wrongQuestions() });
      void queryClient.invalidateQueries({ queryKey: practiceKeys.wrongQuestionsTotal() });
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
    if (!currentQuestion || selectedOptions.size === 0 || submitMutation.isPending) return;
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
        <Button className="mt-4 min-h-[44px]" onClick={onFinish}>
          查看结果
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Mobile-only band: progress badge + exit (desktop uses Header actions). */}
      <PageHero>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="px-3 py-1 text-sm">
            {currentIndex + 1} / {questions.length}
          </Badge>
          <Button variant="ghost" size="md" onClick={onExit} className="min-h-[44px]">
            <LogOut className="size-4" aria-hidden />
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

      {/* Actions. On mobile the bar sticks to the bottom of the scroll area so
          "下一题" is always in the first screen after submitting (F14); desktop
          keeps the original inline row. The bar sits above the safe-area inset;
          the toast viewport is offset above it by the shell slice. */}
      <div
        className={[
          'sticky bottom-0 z-sticky -mx-3 border-t border-border bg-background/95 px-3 py-3 backdrop-blur',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          'md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:pb-0 md:backdrop-blur-none',
        ].join(' ')}
      >
        <div className="flex justify-end gap-2">
          {!submitResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedOptions.size === 0 || submitMutation.isPending}
              aria-busy={submitMutation.isPending}
              className="min-h-[44px]"
            >
              {submitMutation.isPending ? '提交中...' : '提交答案'}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleNext}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {isLast ? '完成练习' : '下一题'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
