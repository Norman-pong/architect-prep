import type { LearningProgress } from './types';

/**
 * Apply an optimistic "mark as learned / unlearned" edit to the cached
 * `LearningProgress` payload. Pure so the mutation can be unit tested without a
 * QueryClient; returns the previous reference when nothing changes.
 *
 * `chapterId` is optional because callers that don't know it (e.g. a stale deep
 * link) can still update the global counters; per-chapter rows then reconcile on
 * the post-settlement refetch.
 */
export function applyMasteryToProgress(
  progress: LearningProgress | undefined,
  pointId: number,
  chapterId: number | undefined,
  mastered: boolean,
): LearningProgress | undefined {
  if (!progress) return progress;

  const masteredIds = new Set(progress.mastered_point_ids ?? []);
  const wasMastered = masteredIds.has(pointId);
  if (wasMastered === mastered) return progress;

  if (mastered) {
    masteredIds.add(pointId);
  } else {
    masteredIds.delete(pointId);
  }

  const masteredPoints = masteredIds.size;
  const totalPoints = progress.total_points;
  const perChapter = (progress.per_chapter ?? []).map((row) => {
    if (chapterId === undefined || row.chapter_id !== chapterId) return row;
    const nextMastered = mastered
      ? Math.min(row.total, row.mastered + 1)
      : Math.max(0, row.mastered - 1);
    return { ...row, mastered: nextMastered };
  });

  return {
    ...progress,
    mastered_point_ids: [...masteredIds],
    mastered_points: masteredPoints,
    coverage: totalPoints > 0 ? masteredPoints / totalPoints : 0,
    per_chapter: perChapter,
  };
}
