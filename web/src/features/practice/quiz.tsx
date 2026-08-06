import { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { EmptyIllustration } from '@/components/empty-state';
import { PageHero } from '@/components/layout/page-hero';
import { useSetHeader } from '@/components/layout/header-context';
import { QuizSkeleton } from './quiz-skeleton';
import { QuizOption } from './quiz-option';
import { QuizResult } from './quiz-result';
import type { Question, PaginatedResponse, SubmitResponse } from './types';

export function PracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const queryClient = useQueryClient();
  const search = useSearch({ from: '/_authenticated/practice/' });
  const chapterFilter = search.chapter;

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

  const progressBadge = (
    <Badge variant="info" className="px-3 py-1 text-sm">
      {currentIndex + 1} / {questions.length}
    </Badge>
  );
  useSetHeader({
    title: '刷题练习',
    subtitle: '单选/多选,每题 1 个正确答案',
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
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex(currentIndex + 1);
    setSelectedOptions(new Set());
    setSubmitResult(null);
  }

  if (isLoading) return <QuizSkeleton />;

  if (!currentQuestion) {
    return (
      <EmptyState
        icon={<EmptyIllustration name="empty-questions" />}
        title="暂无题目"
        description="题库还没有题目,先去添加题目或等待管理员补充题库"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHero>{progressBadge}</PageHero>

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
            <Badge variant="secondary" className="gap-1">
              难度 {currentQuestion.difficulty}
            </Badge>
            <span className="ml-auto hidden md:inline-flex">{progressBadge}</span>
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
            </Button>
          )
        )}
      </div>
    </div>
  );
}
