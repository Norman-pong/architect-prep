import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, EmptyIllustration } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { useSetHeader } from '@/components/layout/header-context';
import { PageHero } from '@/components/layout/page-hero';
import type { PaginatedResponse, WrongQuestion } from './types';

export function WrongQuestionsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<
    Record<number, { is_correct: boolean; correct_answer_keys: string[]; explanation: string }>
  >({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wrong-questions'],
    queryFn: async () => {
      const resp = await api.get('/practice/wrong-questions', {
        params: { page: 1, page_size: 100 },
      });
      return resp.data.data as PaginatedResponse<WrongQuestion>;
    },
  });

  const submitRedoMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as {
        is_correct: boolean;
        correct_answer_keys: string[];
        explanation: string;
      };
    },
    onSuccess: (data, variables) => {
      setSubmitResult((prev) => ({ ...prev, [variables.question_id]: data }));
      void queryClient.invalidateQueries({ queryKey: ['practice-stats'] });
    },
  });

  const items = data?.items ?? [];

  // Title goes to the layout Header. The count badge lives in the main
  // content area (via PageHero below) so mobile (390px) doesn't show the
  // same "X 道错题" number twice — header + main used to repeat it.
  const countBadge =
    items.length > 0 ? <Badge variant="destructive">{items.length} 道错题</Badge> : null;
  useSetHeader({ title: '错题本' });
  function toggleOption(questionId: number, key: string, isMultiple: boolean) {
    if (submitResult[questionId]) return;
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      // Per-question tracking: use `${questionId}:${key}` as composite key
      const composite = `${questionId}:${key}`;
      if (isMultiple) {
        if (next.has(composite)) next.delete(composite);
        else next.add(composite);
      } else {
        // Clear all keys for this question, then set the new one
        for (const k of Array.from(next)) {
          if (k.startsWith(`${questionId}:`)) next.delete(k);
        }
        next.add(composite);
      }
      return next;
    });
  }

  function getSelectedKeys(questionId: number): string[] {
    return Array.from(selectedOptions)
      .filter((k) => k.startsWith(`${questionId}:`))
      .map((k) => k.split(':')[1])
      .sort();
  }

  function handleSubmitRedo(questionId: number) {
    const keys = getSelectedKeys(questionId);
    if (keys.length === 0) return;
    submitRedoMutation.mutate({ question_id: questionId, answer_keys: keys });
  }

  if (isLoading) {
    return <p className="text-muted-foreground">加载中...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <PageHero>{countBadge}</PageHero>
        <EmptyState
          icon={<EmptyIllustration name="empty-wrong" />}
          title="暂无错题"
          description="继续刷题巩固知识，错题会自动汇总到这里。答对后将从错题本移除。"
          actionLabel="去刷题"
          onAction={() => {
            window.location.href = '/practice';
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero>{countBadge}</PageHero>

      {items.map((wq) => {
        const q = wq.question;
        if (!q) return null;
        const isExpanded = expandedId === wq.id;
        const isMultiple = q.question_type === 'multiple';
        const result = submitResult[q.id];
        const selectedKeys = getSelectedKeys(q.id);
        const options: string[] = q.options ?? [];
        const answerKeys: string[] = q.answer_keys ?? [];

        return (
          <Card key={wq.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMultiple && <Badge variant="warning">多选</Badge>}
                  {!isMultiple && <Badge variant="info">单选</Badge>}
                  <Badge variant="success">已加入复习</Badge>
                  <span className="text-xs text-muted-foreground">
                    错题时间: {new Date(wq.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : wq.id)}
                >
                  {isExpanded ? '收起' : '重做'}
                </Button>
              </div>
              <CardTitle className="text-base">{q.content}</CardTitle>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-3">
                {options.map((opt) => {
                  const key = opt.charAt(0);
                  const isSelected = selectedKeys.includes(key);
                  const isCorrect = result?.correct_answer_keys.includes(key);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(q.id, key, isMultiple)}
                      disabled={!!result}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
                        result && isCorrect && 'border-success bg-success/10 text-success',
                        result &&
                          isSelected &&
                          !isCorrect &&
                          'border-destructive bg-destructive/10 text-destructive',
                        !result && isSelected && 'border-primary bg-primary/5',
                        !result && !isSelected && 'border-border hover:bg-muted/50',
                      )}
                    >
                      <span className="font-medium">{opt}</span>
                    </button>
                  );
                })}

                {result && (
                  <div className="rounded-md bg-muted/50 p-3">
                    {result.is_correct ? (
                      <Badge variant="success">已掌握</Badge>
                    ) : (
                      <Badge variant="destructive">仍然错误</Badge>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      正确答案: {result.correct_answer_keys.join(', ')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{result.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {!result ? (
                    <Button
                      size="sm"
                      onClick={() => handleSubmitRedo(q.id)}
                      disabled={selectedKeys.length === 0 || submitRedoMutation.isPending}
                    >
                      提交
                    </Button>
                  ) : (
                    result.is_correct && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedId(null);
                          setSubmitResult((prev) => {
                            const next = { ...prev };
                            delete next[q.id];
                            return next;
                          });
                        }}
                      >
                        关闭
                      </Button>
                    )
                  )}
                </div>

                {answerKeys.length > 0 && !result && (
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer">查看答案</summary>
                    <p className="mt-1">正确答案: {answerKeys.join(', ')}</p>
                  </details>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
