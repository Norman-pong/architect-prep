import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────

export interface ChapterProgress {
  chapter_id: number;
  total: number;
  mastered: number;
}

export interface LastProgress {
  chapter_id: number;
  point_id: number;
  title: string;
}

export interface ProgressResponse {
  total_points: number;
  mastered_points: number;
  coverage: number;
  per_chapter: ChapterProgress[];
  mastered_point_ids: number[];
  last_progress: LastProgress | null;
}

export interface PointStatus {
  point_id: number;
  mastered: boolean;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
}

export interface ToggleMasteredPayload {
  mastered: boolean;
}

// ─── Queries ───────────────────────────────────────────────────────────

export function useOverallProgress() {
  return useQuery({
    queryKey: ['learning', 'progress'],
    queryFn: async () => {
      const resp = await api.get('/learning/progress');
      return resp.data.data as ProgressResponse;
    },
  });
}

export function usePointStatus(pointId: number | null) {
  return useQuery({
    queryKey: ['learning', 'point', pointId],
    queryFn: async () => {
      if (pointId === null) throw new Error('pointId is null');
      const resp = await api.get(`/learning/points/${pointId}`);
      return resp.data.data as PointStatus;
    },
    enabled: !!pointId,
  });
}

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

// ─── Derived ───────────────────────────────────────────────────────────

export function useLastProgress(): LastProgress | null | undefined {
  const { data } = useOverallProgress();
  return data?.last_progress;
}
