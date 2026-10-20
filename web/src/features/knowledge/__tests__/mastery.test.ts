import { describe, it, expect } from 'vite-plus/test';
import { applyMasteryToProgress } from '../mastery';
import type { LearningProgress } from '../types';

function progress(): LearningProgress {
  return {
    total_points: 10,
    mastered_points: 1,
    coverage: 0.1,
    per_chapter: [
      { chapter_id: 1, total: 3, mastered: 1 },
      { chapter_id: 2, total: 2, mastered: 0 },
    ],
    mastered_point_ids: [101],
    last_progress: null,
  };
}

describe('applyMasteryToProgress', () => {
  it('adds a mastered point and bumps global + per-chapter counters', () => {
    const next = applyMasteryToProgress(progress(), 201, 2, true);
    expect(next?.mastered_point_ids).toEqual([101, 201]);
    expect(next?.mastered_points).toBe(2);
    expect(next?.coverage).toBeCloseTo(0.2);
    expect(next?.per_chapter.find((pc) => pc.chapter_id === 2)?.mastered).toBe(1);
    expect(next?.per_chapter.find((pc) => pc.chapter_id === 1)?.mastered).toBe(1);
  });

  it('removes a mastered point and decrements counters', () => {
    const next = applyMasteryToProgress(progress(), 101, 1, false);
    expect(next?.mastered_point_ids).toEqual([]);
    expect(next?.mastered_points).toBe(0);
    expect(next?.coverage).toBe(0);
    expect(next?.per_chapter.find((pc) => pc.chapter_id === 1)?.mastered).toBe(0);
  });

  it('is a no-op when the point is already in the requested state', () => {
    const current = progress();
    expect(applyMasteryToProgress(current, 101, 1, true)).toBe(current);
    expect(applyMasteryToProgress(current, 999, 1, false)).toBe(current);
  });

  it('clamps per-chapter counters to their totals', () => {
    const current = progress();
    current.per_chapter = [{ chapter_id: 1, total: 1, mastered: 1 }];
    const next = applyMasteryToProgress(current, 999, 1, true);
    expect(next?.per_chapter[0].mastered).toBe(1);
  });

  it('keeps per-chapter rows untouched when chapterId is unknown', () => {
    const current = progress();
    const next = applyMasteryToProgress(current, 201, undefined, true);
    expect(next?.per_chapter).toEqual(current.per_chapter);
    expect(next?.mastered_points).toBe(2);
  });

  it('passes undefined through', () => {
    expect(applyMasteryToProgress(undefined, 1, 1, true)).toBeUndefined();
  });
});
