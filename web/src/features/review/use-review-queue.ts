import { useEffect, useMemo, useRef, useState } from 'react';
import { useReviewDue, useReviewGrade, useReviewStats } from './queries';
import type { ReviewItem } from './types';
import type { ReviewMetrics } from './review-card';

/** Fade-out window; the card is removed from the local queue afterwards. */
const FADE_MS = 220;
/**
 * `useReviewDue` requests 50 items per page. Sessions with more than 50 due
 * items are truncated, so the queue position is rendered as "i / 50+".
 */
const QUEUE_PAGE_SIZE = 50;

/**
 * Review queue state machine.
 *
 * The queue is a local snapshot: a graded card is removed only after its
 * fade-out finishes, so a slow/failed refetch can never skip or double-show a
 * card (F2/F3). Server data is adopted whenever no transition is in flight.
 */
export function useReviewQueue() {
  const statsQuery = useReviewStats();
  const queueQuery = useReviewDue();
  const grade = useReviewGrade();
  const dataItems = queueQuery.data?.items;

  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  // Synchronous re-entry guard: state updates are async, refs are not.
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [sessionTotal, setSessionTotal] = useState(0);

  const transitionRef = useRef(false);
  const pendingSyncRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  // Latest server queue, readable from the fade timer without stale closures.
  const dataItemsRef = useRef<ReviewItem[] | undefined>(undefined);

  useEffect(() => {
    dataItemsRef.current = dataItems;
    if (!dataItems) return;
    // A refetch started by the grade mutation must not pull the card the user
    // is still rating out from under the fade animation.
    if (transitionRef.current) {
      pendingSyncRef.current = true;
      return;
    }
    // Update queue and total together: in separate effects the first render
    // would compute a negative queue position (Y8).
    setQueue(dataItems);
    setSessionTotal((prev) => Math.max(prev, dataItems.length));
  }, [dataItems]);

  // Clear a pending fade timer if the page unmounts mid-transition.
  useEffect(
    () => () => {
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  function handleGrade(rating: 1 | 2 | 3 | 4) {
    const item = queue[0];
    if (!item || lockedRef.current) return;
    transitionRef.current = true;
    pendingSyncRef.current = false;
    lockedRef.current = true;
    setLocked(true);
    setGradeError('');
    setLeavingId(item.id);

    // The lock above closes the 220ms window in which a second click could
    // POST the same grade twice (F3).
    grade.mutate(
      { item_type: item.item_type, item_id: item.item_id, rating },
      {
        onSuccess: () => {
          // Fade is purely visual: the card is removed only after it finishes.
          fadeTimerRef.current = window.setTimeout(() => {
            fadeTimerRef.current = null;
            const serverSynced = pendingSyncRef.current;
            transitionRef.current = false;
            pendingSyncRef.current = false;
            setLeavingId(null);
            setQueue((prev) => {
              // The mutation invalidated the queue; if that refetch already
              // landed, prefer the server list, but never resurrect the graded
              // card (a stale response may still contain it).
              const source = serverSynced ? (dataItemsRef.current ?? prev) : prev;
              return source.filter((entry) => entry.id !== item.id);
            });
            setLocked(false);
            lockedRef.current = false;
          }, FADE_MS);
        },
        onError: () => {
          // F2: keep the current card and keep the counters untouched.
          transitionRef.current = false;
          pendingSyncRef.current = false;
          setLeavingId(null);
          setLocked(false);
          lockedRef.current = false;
          setGradeError('评分提交失败，当前卡片已保留，请重试');
        },
      },
    );
  }

  const hasMore = queue.length > 0;
  const queuePosition = hasMore ? Math.max(1, sessionTotal - queue.length + 1) : 0;
  const queueTruncated = (dataItems?.length ?? 0) >= QUEUE_PAGE_SIZE;

  const metrics = useMemo<ReviewMetrics>(() => {
    const due = statsQuery.data?.due_count;
    const reviewed = statsQuery.data?.reviewed_today;
    // 今日进度 = 已复习 / (已复习 + 仍到期)。total_items 是累计值，不作为今日指标。
    const progressTotal = (due ?? 0) + (reviewed ?? 0);
    const progressPct = progressTotal > 0 ? Math.round(((reviewed ?? 0) / progressTotal) * 100) : 0;
    return {
      due,
      reviewed,
      progressPct,
      positionLabel: hasMore
        ? `第 ${queuePosition} / ${sessionTotal}${queueTruncated ? '+' : ''} 张`
        : '已完成',
    };
  }, [statsQuery.data, hasMore, queuePosition, sessionTotal, queueTruncated]);

  return {
    current: queue[0],
    leavingId,
    locked,
    gradeError,
    hasMore,
    metrics,
    isLoading: queueQuery.isLoading || statsQuery.isLoading,
    isError: queueQuery.isError || statsQuery.isError,
    retry: () => {
      void queueQuery.refetch();
      void statsQuery.refetch();
    },
    handleGrade,
  };
}
