import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  chapterPointsQueryOptions,
  useChapters,
  useLearningProgress,
  usePointStatus,
  useSearchKnowledge,
  useRecordView,
  useToggleMastered,
} from './hooks';
import type { Chapter, KnowledgePoint } from './types';

export interface ChapterPointsStatus {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}

interface KnowledgeDataParams {
  /** Chapter currently in the URL (`?chapter=`). */
  chapterId: number | undefined;
  /** Point currently in the URL (`?point=`), even when it isn't loaded yet. */
  pointId: number | undefined;
  /** Desktop chapters the user expanded — each loads its own points (I-03). */
  expandedChapterIds: ReadonlySet<number>;
  /** Debounced search text. */
  searchQuery: string;
}

/**
 * Single owner of the knowledge data queries and their chapter→points cache.
 *
 * Every chapter that needs points is fed through one `useQueries` call: the
 * current chapter (reader), the expanded desktop chapters (I-03) and the
 * previous/next chapters (prefetch for cross-chapter navigation, I-02). That
 * keeps the cache uniform and avoids the old "parent only loads one expanded id"
 * closure.
 */
export function useKnowledgeData({
  chapterId,
  pointId,
  expandedChapterIds,
  searchQuery,
}: KnowledgeDataParams) {
  const queryClient = useQueryClient();

  const chaptersQuery = useChapters();
  const progressQuery = useLearningProgress();
  const pointStatusQuery = usePointStatus(pointId);
  const searchQueryResult = useSearchKnowledge(searchQuery);

  const sortedChapters = useMemo<Chapter[]>(() => {
    if (!chaptersQuery.data) return [];
    return [...chaptersQuery.data].sort((a, b) => a.chapter_no - b.chapter_no);
  }, [chaptersQuery.data]);

  // Current chapter + neighbours (cross-chapter prefetch) + expanded chapters.
  const neighborChapterIds = useMemo<{ prev?: number; next?: number }>(() => {
    if (chapterId === undefined || sortedChapters.length === 0) return {};
    const index = sortedChapters.findIndex((chapter) => chapter.id === chapterId);
    if (index === -1) return {};
    return {
      prev: index > 0 ? sortedChapters[index - 1].id : undefined,
      next: index < sortedChapters.length - 1 ? sortedChapters[index + 1].id : undefined,
    };
  }, [chapterId, sortedChapters]);

  const chapterIdsToLoad = useMemo<number[]>(() => {
    const ids = new Set<number>();
    if (chapterId !== undefined) ids.add(chapterId);
    for (const id of expandedChapterIds) ids.add(id);
    if (neighborChapterIds.prev !== undefined) ids.add(neighborChapterIds.prev);
    if (neighborChapterIds.next !== undefined) ids.add(neighborChapterIds.next);
    return [...ids];
  }, [chapterId, expandedChapterIds, neighborChapterIds]);

  const pointsQueries = useQueries({
    queries: chapterIdsToLoad.map((id) => chapterPointsQueryOptions(id)),
  });

  // Built during render (not memoised) so the maps always reflect the latest
  // query states; the point arrays themselves are stable cache references.
  const pointsByChapter = new Map<number, KnowledgePoint[]>();
  const chapterPointsStatus = new Map<number, ChapterPointsStatus>();
  chapterIdsToLoad.forEach((chapterIdToLoad, index) => {
    const query = pointsQueries[index];
    if (!query) return;
    if (query.data) pointsByChapter.set(chapterIdToLoad, query.data);
    // A failed *background* refetch must not hide already-available points; the
    // error state is only surfaced when there is nothing to render.
    const hasData = query.data !== undefined;
    chapterPointsStatus.set(chapterIdToLoad, {
      isLoading: query.isLoading,
      isError: query.isError && !hasData,
      isEmpty: hasData && !query.isLoading && query.data.length === 0,
    });
  });

  const currentChapter =
    chapterId === undefined
      ? undefined
      : chaptersQuery.data?.find((chapter) => chapter.id === chapterId);
  const currentChapterPoints = chapterId === undefined ? undefined : pointsByChapter.get(chapterId);
  const currentChapterPointsStatus =
    chapterId === undefined ? undefined : chapterPointsStatus.get(chapterId);
  const currentPoint =
    pointId === undefined ? undefined : currentChapterPoints?.find((point) => point.id === pointId);

  // Bulk mastery from progress (one request) overridden by the current point's
  // dedicated status query (fresher after a mutation).
  const pointStatusMap = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const id of progressQuery.data?.mastered_point_ids ?? []) {
      map.set(id, true);
    }
    if (pointStatusQuery.data) {
      map.set(pointStatusQuery.data.point_id, pointStatusQuery.data.mastered);
    }
    return map;
  }, [progressQuery.data?.mastered_point_ids, pointStatusQuery.data]);

  const toggleMasteredMutation = useToggleMastered();
  const recordViewMutation = useRecordView();

  const pendingMasteredPointId = toggleMasteredMutation.isPending
    ? toggleMasteredMutation.variables?.pointId
    : undefined;

  const { mutate: toggleMastered, isPending: isTogglePending } = toggleMasteredMutation;
  // A ref closes the same-tick double-click window that React state cannot: two
  // clicks dispatched before the pending render would both look "idle" to the
  // callback and fire two POSTs (I-06).
  const toggleInFlightRef = useRef(false);
  useEffect(() => {
    if (!isTogglePending) toggleInFlightRef.current = false;
  }, [isTogglePending]);
  const handleToggleMastered = useCallback(
    (pointId: number, chapterId: number, mastered: boolean) => {
      if (isTogglePending || toggleInFlightRef.current) return;
      toggleInFlightRef.current = true;
      toggleMastered({ pointId, chapterId, mastered });
    },
    [isTogglePending, toggleMastered],
  );

  const { mutate: recordView } = recordViewMutation;
  const handleRecordView = useCallback(
    (pointId: number) => {
      recordView(pointId);
    },
    [recordView],
  );

  const retryChapters = useCallback(() => {
    void chaptersQuery.refetch();
  }, [chaptersQuery.refetch]);

  const retryProgress = useCallback(() => {
    void progressQuery.refetch();
  }, [progressQuery.refetch]);

  const retrySearch = useCallback(() => {
    void searchQueryResult.refetch();
  }, [searchQueryResult.refetch]);

  const retryChapterPoints = useCallback(
    (targetChapterId: number) => {
      void queryClient.refetchQueries({ queryKey: ['knowledge-points', targetChapterId] });
    },
    [queryClient],
  );

  return {
    // chapters / progress
    chapters: chaptersQuery.data,
    chaptersLoading: chaptersQuery.isLoading,
    chaptersError: chaptersQuery.isError && chaptersQuery.data === undefined,
    retryChapters,
    progress: progressQuery.data,
    progressError: progressQuery.isError && progressQuery.data === undefined,
    retryProgress,
    // points by chapter
    pointsByChapter,
    chapterPointsStatus,
    currentChapter,
    currentChapterPoints,
    currentChapterPointsStatus,
    currentPoint,
    retryChapterPoints,
    // point status
    pointStatus: pointStatusQuery.data,
    pointStatusMap,
    // search
    searchResults: searchQueryResult.data,
    searchLoading: searchQueryResult.isLoading,
    searchError: searchQueryResult.isError,
    retrySearch,
    // mutations
    pendingMasteredPointId,
    handleToggleMastered,
    handleRecordView,
  };
}

export type KnowledgeData = ReturnType<typeof useKnowledgeData>;
