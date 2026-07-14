import { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/empty-state';
import type { Question, PaginatedResponse, SubmitResponse } from './types';

export function PracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const queryClient = useQueryClient();
  const search = useSearch({ from: '/_authenticated/practice/' });
  const chapterFilter = search.chapter;

  // Reset state when chapter filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOptions(new Set());
    setSubmitResult(null);
  }, [chapterFilter]);

  const { data: questionList, isLoading } = useQuery({
    queryKey: ['practice-questions', chapterFilter],
    queryFn: async () => {
      const resp = await api.get('/practice/questions', {
        params: { chapter_id: chapterFilter ?? undefined, page: 1, page_size: 100 },
      });
      return resp.data.data as PaginatedResponse<Question>;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as SubmitResponse;
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      void queryClient.invalidateQueries({ queryKey: ['practice-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['wrong-questions'] });
    },
  });

  const questions = questionList?.items ?? [];
  const currentQuestion = questions[currentIndex];
  const isMultiple = currentQuestion?.question_type === 'multiple';

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
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex(currentIndex + 1);
    setSelectedOptions(new Set());
    setSubmitResult(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">加载中...</div>
    );
  }

  if (!currentQuestion) {
    return (
      <EmptyState
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        }
        title="暂无题目"
        description="题库还没有题目,先去添加题目或等待管理员补充题库"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">刷题练习</h1>
          <p className="mt-1 text-sm text-muted-foreground">单选/多选,每题 1 个正确答案</p>
        </div>
        <Badge variant="info" className="px-3 py-1 text-sm">
          {currentIndex + 1} / {questions.length}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {isMultiple ? (
              <Badge variant="warning" className="gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                多选
              </Badge>
            ) : (
              <Badge variant="info" className="gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                单选
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              难度 {currentQuestion.difficulty}
            </Badge>
          </div>
          <CardTitle className="mt-2 text-base leading-relaxed">
            {currentQuestion.content}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(currentQuestion.options ?? []).map((opt) => {
            const key = opt.charAt(0);
            const isSelected = selectedOptions.has(key);
            const isCorrect = submitResult?.correct_answer_keys.includes(key);
            const isWrongSelected = submitResult && isSelected && !isCorrect;
            const showResult = !!submitResult;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(key)}
                disabled={!!submitResult}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-200',
                  'hover:scale-[1.005] hover:shadow-sm active:scale-[0.998]',
                  showResult && isCorrect && 'border-success bg-success/15 text-success shadow-sm',
                  showResult &&
                    isWrongSelected &&
                    'border-destructive bg-destructive/15 text-destructive shadow-sm',
                  !showResult && isSelected && 'border-primary bg-primary/10 shadow-sm',
                  !showResult &&
                    !isSelected &&
                    'border-border hover:border-primary/40 hover:bg-primary/5',
                  showResult && !isCorrect && !isWrongSelected && 'border-border opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors',
                    showResult && isCorrect && 'border-success bg-success text-success-foreground',
                    showResult &&
                      isWrongSelected &&
                      'border-destructive bg-destructive text-destructive-foreground',
                    !showResult &&
                      isSelected &&
                      'border-primary bg-primary text-primary-foreground',
                    !showResult &&
                      !isSelected &&
                      'border-border bg-background text-muted-foreground',
                  )}
                >
                  {showResult && isCorrect ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : showResult && isWrongSelected ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  ) : (
                    key
                  )}
                </span>
                <span className="flex-1 font-medium">{opt}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {submitResult && (
        <Card
          className={cn(
            'border-2',
            submitResult.is_correct
              ? 'border-success/30 bg-success/5'
              : 'border-destructive/30 bg-destructive/5',
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {submitResult.is_correct ? (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-success-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <Badge variant="success">回答正确</Badge>
                </>
              ) : (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </span>
                  <Badge variant="destructive">回答错误</Badge>
                </>
              )}
              <span className="text-muted-foreground">正确答案:</span>
              <span className="font-semibold text-foreground">
                {submitResult.correct_answer_keys.join(', ')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                解析
              </p>
              <p className="text-sm leading-relaxed text-foreground">{submitResult.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        {!submitResult ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0 || submitMutation.isPending}
          >
            {submitMutation.isPending ? '提交中...' : '提交答案'}
          </Button>
        ) : (
          currentIndex < questions.length - 1 && (
            <Button variant="outline" onClick={handleNext}>
              下一题
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          )
        )}
      </div>
    </div>
  );
}
