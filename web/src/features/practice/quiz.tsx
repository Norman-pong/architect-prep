import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  chapter_id: number;
  exam_type: string;
  question_type: string;
  content: string;
  options: string[];
  difficulty: number;
}

interface QuestionList {
  items: Question[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface SubmitResponse {
  is_correct: boolean;
  correct_answer_keys: string[];
  explanation: string;
}

export function PracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const queryClient = useQueryClient();

  const { data: questionList, isLoading } = useQuery({
    queryKey: ['practice-questions'],
    queryFn: async () => {
      const resp = await api.get('/practice/questions', { params: { page: 1, page_size: 20 } });
      return resp.data.data as QuestionList;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as SubmitResponse;
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      queryClient.invalidateQueries({ queryKey: ['practice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wrong-questions'] });
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
    return <p className="text-muted-foreground">Loading questions...</p>;
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground">No questions available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">刷题练习</h1>
        <Badge variant="info">
          {currentIndex + 1} / {questions.length}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isMultiple && <Badge variant="warning">多选</Badge>}
            {!isMultiple && <Badge variant="info">单选</Badge>}
            <Badge variant="default">难度 {currentQuestion.difficulty}</Badge>
          </div>
          <CardTitle className="text-base">{currentQuestion.content}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentQuestion.options.map((opt) => {
            const key = opt.charAt(0);
            const isSelected = selectedOptions.has(key);
            const isCorrect = submitResult?.correct_answer_keys.includes(key);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(key)}
                disabled={!!submitResult}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
                  submitResult && isCorrect && 'border-success bg-success/10 text-success',
                  submitResult &&
                    isSelected &&
                    !isCorrect &&
                    'border-destructive bg-destructive/10 text-destructive',
                  !submitResult && isSelected && 'border-primary bg-primary/5',
                  !submitResult && !isSelected && 'border-border hover:bg-muted/50',
                )}
              >
                <span className="font-medium">{opt}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {submitResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {submitResult.is_correct ? (
                <Badge variant="success">正确</Badge>
              ) : (
                <Badge variant="destructive">错误</Badge>
              )}
              <span>正确答案: {submitResult.correct_answer_keys.join(', ')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{submitResult.explanation}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        {!submitResult ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0 || submitMutation.isPending}
          >
            提交答案
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
