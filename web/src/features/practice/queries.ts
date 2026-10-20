import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaginatedResponse, PracticeStats, WrongQuestion } from './types';

// ─── Query keys ────────────────────────────────────────────────────────
// Single source of truth for practice-related cache entries. Mutations in
// quiz / wrong-questions invalidate these prefixes instead of ad-hoc strings.
// ────────────────────────────────────────────────────────────────────────

export const practiceKeys = {
  all: ['practice'] as const,
  stats: () => ['practice', 'stats'] as const,
  wrongQuestions: () => ['practice', 'wrong-questions'] as const,
  wrongQuestionsTotal: () => ['practice', 'wrong-questions-total'] as const,
  favorites: () => ['practice', 'favorites'] as const,
} as const;

// ─── Queries ───────────────────────────────────────────────────────────

/** Overall practice accuracy / totals, shared by dashboard + stats page. */
export function usePracticeStats() {
  return useQuery({
    queryKey: practiceKeys.stats(),
    queryFn: async () => {
      const resp = await api.get('/practice/stats');
      return resp.data.data as PracticeStats;
    },
    staleTime: 30 * 1000,
  });
}

/** Lightweight wrong-question count used by the dashboard tile. */
export function useWrongQuestionsTotal() {
  return useQuery({
    queryKey: practiceKeys.wrongQuestionsTotal(),
    queryFn: async () => {
      const resp = await api.get('/practice/wrong-questions', {
        params: { page: 1, page_size: 1 },
      });
      const data = resp.data.data as PaginatedResponse<WrongQuestion>;
      return data.total;
    },
    staleTime: 30 * 1000,
  });
}
