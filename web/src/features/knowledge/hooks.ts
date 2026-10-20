import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { applyMasteryToProgress } from './mastery';
import type { Chapter, LearningProgress, PointStatus, KnowledgePoint } from './types';

// ── Query keys / options ─────────────────────────────

/** Chapter points rarely change, and the reader cross-prefetches neighbours, so
 *  one cache entry per chapter is kept warm for 5 minutes (design §5.3). */
const CHAPTER_POINTS_STALE_TIME = 5 * 60 * 1000;

export const chapterPointsQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: ['knowledge-points', chapterId] as const,
    queryFn: async () => {
      const resp = await api.get(`/knowledge/chapters/${chapterId}/points`);
      return resp.data.data as KnowledgePoint[];
    },
    staleTime: CHAPTER_POINTS_STALE_TIME,
  });

// ── Queries ──────────────────────────────────────────

export function useChapters() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: async () => {
      const resp = await api.get('/knowledge/chapters');
      return resp.data.data as Chapter[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLearningProgress() {
  return useQuery({
    queryKey: ['learning', 'progress'],
    queryFn: async () => {
      const resp = await api.get('/learning/progress');
      return resp.data.data as LearningProgress;
    },
    staleTime: 60 * 1000,
  });
}

export function usePointStatus(pointId: number | undefined) {
  return useQuery({
    queryKey: ['learning', 'point', pointId],
    queryFn: async () => {
      const resp = await api.get(`/learning/points/${pointId}`);
      return resp.data.data as PointStatus;
    },
    enabled: !!pointId,
    staleTime: 30 * 1000,
  });
}

export function useSearchKnowledge(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const resp = await api.get('/knowledge/search', { params: { q } });
      return resp.data.data as KnowledgePoint[];
    },
    enabled: q.length > 0,
    staleTime: 30 * 1000,
  });
}

// ── Mutations ────────────────────────────────────────

export function useRecordView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pointId: number) => {
      const resp = await api.post(`/learning/points/${pointId}/view`);
      return resp.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learning', 'progress'] });
    },
  });
}

export interface ToggleMasteredVariables {
  pointId: number;
  mastered: boolean;
  /** Known by both call sites (outline rows / reader) so the optimistic
   *  per-chapter counters can be updated without another lookup. */
  chapterId?: number;
}

/** Optimistic toggle (I-06): flip the cached progress/point status immediately,
 *  roll back on failure, then reconcile with the server. */
export function useToggleMastered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pointId, mastered }: ToggleMasteredVariables) => {
      const resp = await api.post(`/learning/points/${pointId}/master`, { mastered });
      return resp.data.data;
    },
    onMutate: async ({ pointId, mastered, chapterId }) => {
      await queryClient.cancelQueries({ queryKey: ['learning'] });

      const previousProgress = queryClient.getQueryData<LearningProgress>(['learning', 'progress']);
      const previousStatus = queryClient.getQueryData<PointStatus>(['learning', 'point', pointId]);

      queryClient.setQueryData<LearningProgress>(['learning', 'progress'], (old) =>
        applyMasteryToProgress(old, pointId, chapterId, mastered),
      );
      queryClient.setQueryData<PointStatus>(['learning', 'point', pointId], (old) =>
        old ? { ...old, mastered } : old,
      );

      return { previousProgress, previousStatus, pointId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(['learning', 'progress'], context.previousProgress);
      queryClient.setQueryData(['learning', 'point', context.pointId], context.previousStatus);
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['learning'] });
      void queryClient.invalidateQueries({ queryKey: ['learning', 'point', variables.pointId] });
    },
  });
}

// ── Progress helpers ─────────────────────────────────

export function getChapterProgress(
  chapterId: number,
  progress: LearningProgress | undefined,
): { total: number; mastered: number } {
  if (!progress?.per_chapter) return { total: 0, mastered: 0 };
  const pc = progress.per_chapter.find((p) => p.chapter_id === chapterId);
  return { total: pc?.total ?? 0, mastered: pc?.mastered ?? 0 };
}

export function isChapterCompleted(
  chapterId: number,
  progress: LearningProgress | undefined,
): boolean {
  const { total, mastered } = getChapterProgress(chapterId, progress);
  return total > 0 && total === mastered;
}

/** Map a 0..1 mastery ratio to a Tailwind color class.
 *  0%        → destructive (red)    — needs attention
 *  1-29%     → destructive (red)    — barely started
 *  30-69%    → warning (amber)      — in progress
 *  70-99%    → primary (blue)       — almost there
 *  100%      → success (green)      — mastered
 *  Use `isChapterCompleted` for the explicit 100% green path. */
export function getMasteryLevel(
  mastered: number,
  total: number,
): 'destructive' | 'warning' | 'primary' {
  if (total <= 0 || mastered <= 0) return 'destructive';
  const ratio = mastered / total;
  if (ratio < 0.3) return 'destructive';
  if (ratio < 0.7) return 'warning';
  return 'primary';
}
