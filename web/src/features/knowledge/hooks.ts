import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Chapter, LearningProgress, PointStatus, KnowledgePoint } from './types';

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

export function useChapterPoints(chapterId: number | undefined) {
  return useQuery({
    queryKey: ['knowledge-points', chapterId],
    queryFn: async () => {
      const resp = await api.get(`/knowledge/chapters/${chapterId}/points`);
      return resp.data.data as KnowledgePoint[];
    },
    enabled: !!chapterId,
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

export function useToggleMastered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pointId, mastered }: { pointId: number; mastered: boolean }) => {
      const resp = await api.post(`/learning/points/${pointId}/master`, { mastered });
      return resp.data.data;
    },
    onSuccess: (_data, variables) => {
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

// ── Navigation helpers ───────────────────────────────

export function findCrossChapterNext(
  currentChapterId: number,
  currentPointId: number,
  allChapters: Chapter[] | undefined,
  chapterPointsMap: Map<number, KnowledgePoint[]>,
): { chapterId: number; pointId: number } | null {
  if (!allChapters) return null;

  const points = chapterPointsMap.get(currentChapterId) ?? [];
  const idx = points.findIndex((p) => p.id === currentPointId);

  // Same chapter next point
  if (idx >= 0 && idx < points.length - 1) {
    return { chapterId: currentChapterId, pointId: points[idx + 1].id };
  }

  // Cross to next chapter
  const sortedChapters = [...allChapters].sort((a, b) => a.chapter_no - b.chapter_no);
  const chIdx = sortedChapters.findIndex((c) => c.id === currentChapterId);
  if (chIdx >= 0 && chIdx < sortedChapters.length - 1) {
    const nextCh = sortedChapters[chIdx + 1];
    const nextPoints = chapterPointsMap.get(nextCh.id) ?? [];
    if (nextPoints.length > 0) {
      return { chapterId: nextCh.id, pointId: nextPoints[0].id };
    }
  }

  return null;
}

export function findCrossChapterPrev(
  currentChapterId: number,
  currentPointId: number,
  allChapters: Chapter[] | undefined,
  chapterPointsMap: Map<number, KnowledgePoint[]>,
): { chapterId: number; pointId: number } | null {
  if (!allChapters) return null;

  const points = chapterPointsMap.get(currentChapterId) ?? [];
  const idx = points.findIndex((p) => p.id === currentPointId);

  // Same chapter prev point
  if (idx > 0) {
    return { chapterId: currentChapterId, pointId: points[idx - 1].id };
  }

  // Cross to prev chapter
  const sortedChapters = [...allChapters].sort((a, b) => a.chapter_no - b.chapter_no);
  const chIdx = sortedChapters.findIndex((c) => c.id === currentChapterId);
  if (chIdx > 0) {
    const prevCh = sortedChapters[chIdx - 1];
    const prevPoints = chapterPointsMap.get(prevCh.id) ?? [];
    if (prevPoints.length > 0) {
      return { chapterId: prevCh.id, pointId: prevPoints[prevPoints.length - 1].id };
    }
  }

  return null;
}
