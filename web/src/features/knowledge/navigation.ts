import type { Chapter, KnowledgePoint } from './types';

/** A cross-chapter navigation target. `pointId` is absent while the target
 *  chapter's points are still loading — callers navigate to the chapter and let
 *  the first/last point be resolved once the query resolves. */
export interface ChapterNavTarget {
  chapterId: number;
  pointId?: number;
}

export type ChapterPointsLookup = (chapterId: number) => KnowledgePoint[] | undefined;

function sortByChapterNo(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort((a, b) => a.chapter_no - b.chapter_no);
}

function findNextChapterTarget(
  chapters: Chapter[],
  currentIndex: number,
  getPoints: ChapterPointsLookup,
): ChapterNavTarget | null {
  for (let i = currentIndex + 1; i < chapters.length; i++) {
    const chapterId = chapters[i].id;
    const points = getPoints(chapterId);
    if (points === undefined) return { chapterId };
    if (points.length > 0) return { chapterId, pointId: points[0].id };
  }
  return null;
}

function findPrevChapterTarget(
  chapters: Chapter[],
  currentIndex: number,
  getPoints: ChapterPointsLookup,
): ChapterNavTarget | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const chapterId = chapters[i].id;
    const points = getPoints(chapterId);
    if (points === undefined) return { chapterId };
    if (points.length > 0) return { chapterId, pointId: points[points.length - 1].id };
  }
  return null;
}

/**
 * Resolve the next section in reading order: the following point inside the
 * current chapter, otherwise the first point of the next non-empty chapter.
 *
 * Chapters are ordered by `chapter_no`, never by load order — reading chapter 3
 * while chapter 7 is expanded must not skip chapters 4-6 (I-02).
 * Returns null only when there is genuinely nothing after the current point.
 */
export function findCrossChapterNext(
  currentChapterId: number,
  currentPointId: number,
  allChapters: Chapter[] | undefined,
  getPoints: ChapterPointsLookup,
): ChapterNavTarget | null {
  if (!allChapters || allChapters.length === 0) return null;

  const chapters = sortByChapterNo(allChapters);
  const currentIndex = chapters.findIndex((chapter) => chapter.id === currentChapterId);
  if (currentIndex === -1) return null;

  const points = getPoints(currentChapterId);
  const pointIndex = points?.findIndex((point) => point.id === currentPointId) ?? -1;
  if (points && pointIndex >= 0 && pointIndex < points.length - 1) {
    return { chapterId: currentChapterId, pointId: points[pointIndex + 1].id };
  }

  return findNextChapterTarget(chapters, currentIndex, getPoints);
}

/**
 * Resolve the previous section in reading order: the preceding point inside the
 * current chapter, otherwise the last point of the previous non-empty chapter.
 */
export function findCrossChapterPrev(
  currentChapterId: number,
  currentPointId: number,
  allChapters: Chapter[] | undefined,
  getPoints: ChapterPointsLookup,
): ChapterNavTarget | null {
  if (!allChapters || allChapters.length === 0) return null;

  const chapters = sortByChapterNo(allChapters);
  const currentIndex = chapters.findIndex((chapter) => chapter.id === currentChapterId);
  if (currentIndex === -1) return null;

  const points = getPoints(currentChapterId);
  const pointIndex = points?.findIndex((point) => point.id === currentPointId) ?? -1;
  if (points && pointIndex > 0) {
    return { chapterId: currentChapterId, pointId: points[pointIndex - 1].id };
  }

  return findPrevChapterTarget(chapters, currentIndex, getPoints);
}

/** Point title for a resolved target, when that chapter's points are loaded. */
export function resolveTargetPointTitle(
  pointsByChapter: Map<number, KnowledgePoint[]>,
  target: ChapterNavTarget | null,
): string | undefined {
  if (!target || target.pointId === undefined) return undefined;
  return pointsByChapter.get(target.chapterId)?.find((point) => point.id === target.pointId)?.title;
}

/** Chapter object for a resolved target (used for labels while points load). */
export function resolveTargetChapter(
  chapters: Chapter[] | undefined,
  target: ChapterNavTarget | null,
): Chapter | undefined {
  if (!target) return undefined;
  return chapters?.find((chapter) => chapter.id === target.chapterId);
}
