import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GradeResponse, PaginatedResponse, ReviewItem, ReviewStats } from './types';

// ─── Query keys ────────────────────────────────────────────────────────
// Centralized so hooks & invalidations agree on what to bust.
// Pattern mirrors features/learning/queries.ts.
// ────────────────────────────────────────────────────────────────────────

export const reviewKeys = {
  all: ['review'] as const,
  due: (itemType?: string) => ['review', 'due', itemType ?? 'all'] as const,
  stats: () => ['review', 'stats'] as const,
} as const;

// ─── useReviewDue ──────────────────────────────────────────────────────
// Pull the user's queue for "today" — used by /review page.
// Optional itemType narrows to wrong_question | knowledge_card.
// ────────────────────────────────────────────────────────────────────────

export function useReviewDue(itemType?: string) {
  return useQuery({
    queryKey: reviewKeys.due(itemType),
    queryFn: async () => {
      const params: Record<string, string | number> = { page: 1, page_size: 50 };
      if (itemType) params.item_type = itemType;
      const resp = await api.get('/review/due', { params });
      return resp.data.data as PaginatedResponse<ReviewItem>;
    },
  });
}

// ─── useReviewStats ────────────────────────────────────────────────────
// Header KPI numbers for the review page.
// ────────────────────────────────────────────────────────────────────────

export function useReviewStats() {
  return useQuery({
    queryKey: reviewKeys.stats(),
    queryFn: async () => {
      const resp = await api.get('/review/stats');
      return resp.data.data as ReviewStats;
    },
  });
}

// ─── useReviewGrade ────────────────────────────────────────────────────
// FSRS grade mutation. On success, the queue and stats invalidate so the
// next card slides in and the counters refresh.
// ────────────────────────────────────────────────────────────────────────

export interface GradePayload {
  item_type: 'wrong_question' | 'knowledge_card';
  item_id: number;
  rating: 1 | 2 | 3 | 4;
}

export function useReviewGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GradePayload) => {
      const resp = await api.post('/review/grade', payload);
      return resp.data.data as GradeResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

// ─── useReviewMigrate ──────────────────────────────────────────────────
// One-shot backfill: turns all current wrong questions into review items.
// ────────────────────────────────────────────────────────────────────────

export function useReviewMigrate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const resp = await api.post('/review/migrate');
      return resp.data.data as { migrated: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
