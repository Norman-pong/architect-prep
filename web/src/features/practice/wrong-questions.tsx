import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState, EmptyIllustration } from '@/components/empty-state';
import { WrongQuestionsSkeleton } from './wrong-questions-skeleton';
import { WrongQuestionCard, type RedoResult } from './wrong-question-card';
import { cn } from '@/lib/utils';
import { useSetHeader } from '@/components/layout/header-context';
import { PageHero } from '@/components/layout/page-hero';
import { practiceKeys } from './queries';
import type { PaginatedResponse, WrongQuestion } from './types';

const PAGE_SIZE = 20;

// Chapter / question-type filters are intentionally deferred to Phase 2
// (design §4.4 + PR 2-3): the backend list endpoint has no filter params yet.
export function WrongQuestionsPage() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<Record<number, RedoResult>>({});
  // Per-question in-flight set: submitting one redo never blocks the others (R3).
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...practiceKeys.wrongQuestions(), page],
    queryFn: async () => {
      const resp = await api.get('/practice/wrong-questions', {
        params: { page, page_size: PAGE_SIZE },
      });
      return resp.data.data as PaginatedResponse<WrongQuestion>;
    },
    placeholderData: keepPreviousData,
  });

  const submitRedoMutation = useMutation({
    mutationFn: async (params: { question_id: number; answer_keys: string[] }) => {
      const resp = await api.post('/practice/submit', params);
      return resp.data.data as Omit<RedoResult, 'submitted_keys'>;
    },
    onMutate: (variables) => {
      setPendingIds((prev) => new Set(prev).add(variables.question_id));
    },
    onSuccess: (data, variables) => {
      // Snapshot the submitted keys together with the response so later option
      // edits on another card can never rewrite this card's highlighting (R3).
      setSubmitResult((prev) => ({
        ...prev,
        [variables.question_id]: { ...data, submitted_keys: variables.answer_keys },
      }));
      // The backend keeps the wrong_questions row even after a correct redo, so
      // the list is intentionally not refetched here — the row is marked
      // "已订正" inline instead of optimistically disappearing.
      void queryClient.invalidateQueries({ queryKey: practiceKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: practiceKeys.wrongQuestionsTotal() });
    },
    onSettled: (_data, _error, variables) => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.question_id);
        return next;
      });
    },
  });

  const data = query.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;

  // Desktop badge lives in the Header action slot; mobile renders the same
  // count through PageHero, so the two are never visible together (F10).
  const headerActions = useMemo(
    () =>
      total > 0 ? (
        <div className="hidden items-center md:flex">
          <Badge variant="destructive">{total} 道错题</Badge>
        </div>
      ) : null,
    [total],
  );
  const mobileBadge = total > 0 ? <Badge variant="destructive">{total} 道错题</Badge> : null;
  useSetHeader({ title: '错题本', actions: headerActions });

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

  function resetQuestion(questionId: number) {
    setSubmitResult((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      for (const key of Array.from(next)) {
        if (key.startsWith(`${questionId}:`)) next.delete(key);
      }
      return next;
    });
  }

  if (query.isLoading) {
    return <WrongQuestionsSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <ErrorState
          title="错题加载失败"
          description="暂时无法获取错题列表，请检查网络后重试。"
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <EmptyState
          icon={<EmptyIllustration name="empty-wrong" />}
          title="暂无错题"
          description="继续刷题巩固知识，错题会自动汇总到这里；重做正确后会标记为「已订正」，仍保留在本页。"
        />
        <div className="flex justify-center">
          <Link to="/practice" className={cn(buttonVariants({ size: 'lg' }), 'min-h-[44px]')}>
            去刷题
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <PageHero>{mobileBadge}</PageHero>

      <div className={cn('space-y-6 transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        {items.map((wq) => {
          const selectedKeys = getSelectedKeys(wq.question?.id ?? 0);
          return (
            <WrongQuestionCard
              key={wq.id}
              wq={wq}
              expanded={expandedId === wq.id}
              pending={wq.question ? pendingIds.has(wq.question.id) : false}
              result={wq.question ? submitResult[wq.question.id] : undefined}
              selectedKeys={selectedKeys}
              onToggleExpand={() => setExpandedId(expandedId === wq.id ? null : wq.id)}
              onToggleOption={(key, isMultiple) => {
                if (wq.question) toggleOption(wq.question.id, key, isMultiple);
              }}
              onSubmit={() => {
                if (wq.question) handleSubmitRedo(wq.question.id);
              }}
              onReset={() => {
                if (wq.question) resetQuestion(wq.question.id);
              }}
              onCollapse={() => setExpandedId(null)}
            />
          );
        })}
      </div>

      {/* Server-side pagination (page_size=20). Filters are Phase 2. */}
      <nav
        aria-label="错题分页"
        className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
      >
        <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
          第 {data?.page ?? page} / {totalPages} 页 · 共 {total} 题
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={(data?.page ?? page) <= 1}
            className="min-h-[44px]"
          >
            <ChevronLeft className="size-4" aria-hidden />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={(data?.page ?? page) >= totalPages}
            className="min-h-[44px]"
          >
            下一页
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </nav>
    </div>
  );
}
