import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useKnowledgeData } from './use-knowledge-data';
import { useIsMobile } from './use-is-mobile';
import type { KnowledgeSearch } from './knowledge-search';

interface PendingChapterNav {
  chapterId: number;
  /** Direction of the automatic jump once the chapter's points resolve. */
  edge: 'first' | 'last';
}

/**
 * Owns the knowledge page's URL state, expansion state and overlay state so the
 * route file only assembles the views (PR 0-3 split). Scroll-position restore on
 * reader back is deferred to Phase 3 (design §6).
 */
export function useKnowledgePage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/knowledge/' });
  const isMobile = useIsMobile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search.q ?? '');
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<number>>(() => new Set());
  // A chapter selection (mobile outline / drawer / cross-chapter prev-next) is
  // resolved asynchronously: remember the direction so we jump to the first or
  // last point as soon as that chapter's points are loaded (I-01 / I-02).
  const [pendingChapterNav, setPendingChapterNav] = useState<PendingChapterNav | null>(() => {
    // Initial mobile deep link (?chapter=X without ?point=) opens the reader at
    // the first point. Not re-run later so the reader's back button works.
    if (isMobile && search.chapter !== undefined && search.point === undefined) {
      return { chapterId: search.chapter, edge: 'first' };
    }
    return null;
  });

  const data = useKnowledgeData({
    chapterId: search.chapter,
    pointId: search.point,
    expandedChapterIds,
    searchQuery,
  });

  const { currentChapterPoints } = data;

  // ── Navigation ─────────────────────────────────────
  const navigateToPoint = useCallback(
    (chapterId: number, pointId: number) => {
      const next: KnowledgeSearch = { chapter: chapterId, point: pointId };
      if (search.q) next.q = search.q;
      void navigate({ to: '/knowledge', search: next });
    },
    [navigate, search.q],
  );

  const navigateToChapter = useCallback(
    (chapterId: number, edge: 'first' | 'last' = 'first') => {
      setPendingChapterNav({ chapterId, edge });
      const next: KnowledgeSearch = { chapter: chapterId };
      if (search.q) next.q = search.q;
      void navigate({ to: '/knowledge', search: next });
    },
    [navigate, search.q],
  );

  /** Reader back: drop the point but keep the chapter (and search context) so
   *  the outline returns with the chapter expanded (I-14). */
  const navigateBack = useCallback(() => {
    const next: KnowledgeSearch = {};
    if (search.chapter !== undefined) next.chapter = search.chapter;
    if (search.q) next.q = search.q;
    void navigate({ to: '/knowledge', search: next });
  }, [navigate, search.chapter, search.q]);

  const handleContinue = useCallback(() => {
    const lastProgress = data.progress?.last_progress;
    if (lastProgress) navigateToPoint(lastProgress.chapter_id, lastProgress.point_id);
  }, [data.progress, navigateToPoint]);

  // ── Overlays ───────────────────────────────────────
  const openSearch = useCallback(() => setSearchOpen(true), []);

  /** Closing the sheet discards the query and its URL `q` (I-15). */
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    if (search.q) {
      const next: KnowledgeSearch = {};
      if (search.chapter !== undefined) next.chapter = search.chapter;
      if (search.point !== undefined) next.point = search.point;
      void navigate({ to: '/knowledge', search: next, replace: true });
    }
  }, [navigate, search.chapter, search.point, search.q]);

  /** Opening a search result keeps the query in the URL so returning from the
   *  reader preserves the search context (I-14). */
  const selectSearchResult = useCallback(
    (chapterId: number, pointId: number) => {
      setSearchOpen(false);
      const next: KnowledgeSearch = { chapter: chapterId, point: pointId };
      const query = searchQuery.trim();
      if (query) next.q = query;
      void navigate({ to: '/knowledge', search: next });
    },
    [navigate, searchQuery],
  );

  // ── Desktop expansion (I-03 / I-14) ────────────────
  const toggleChapter = useCallback((chapterId: number) => {
    setExpandedChapterIds((previous) => {
      const next = new Set(previous);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!data.chapters) return;
    setExpandedChapterIds(new Set(data.chapters.map((chapter) => chapter.id)));
  }, [data.chapters]);

  const collapseAll = useCallback(() => setExpandedChapterIds(new Set()), []);

  // ── Effects ────────────────────────────────────────
  // Resolve a pending chapter selection into its first/last point once loaded.
  useEffect(() => {
    if (!pendingChapterNav) return;
    // The router may apply the URL change after the pending state commit (e.g.
    // when selecting a chapter from the reader, the old `?point=` is still in
    // `search` for one render). Only treat a present point as "resolved" when it
    // belongs to the requested chapter.
    if (search.chapter !== pendingChapterNav.chapterId) return;
    if (search.point !== undefined) {
      setPendingChapterNav(null);
      return;
    }
    if (currentChapterPoints === undefined) return;
    if (currentChapterPoints.length === 0) {
      setPendingChapterNav(null);
      return;
    }
    const target =
      pendingChapterNav.edge === 'last'
        ? currentChapterPoints[currentChapterPoints.length - 1]
        : currentChapterPoints[0];
    navigateToPoint(pendingChapterNav.chapterId, target.id);
  }, [pendingChapterNav, search.point, search.chapter, currentChapterPoints, navigateToPoint]);

  // Desktop `?chapter=` deep link auto-expands that chapter (I-14).
  useEffect(() => {
    if (isMobile || search.chapter === undefined) return;
    const chapterId = search.chapter;
    setExpandedChapterIds((previous) => {
      if (previous.has(chapterId)) return previous;
      return new Set(previous).add(chapterId);
    });
  }, [isMobile, search.chapter]);

  // Keep the sheet input in sync with the URL (back/forward, result selection).
  useEffect(() => {
    setSearchQuery(search.q ?? '');
  }, [search.q]);

  // ── Derived view state ─────────────────────────────
  const isReading =
    search.chapter !== undefined && (search.point !== undefined || pendingChapterNav !== null);

  return {
    ...data,
    search,
    drawerOpen,
    setDrawerOpen,
    searchOpen,
    searchQuery,
    setSearchQuery,
    navigateToPoint,
    navigateToChapter,
    navigateBack,
    handleContinue,
    openSearch,
    closeSearch,
    selectSearchResult,
    expandedChapterIds,
    toggleChapter,
    expandAll,
    collapseAll,
    isMobile,
    isReading,
    showMobileOutline: isMobile && !isReading,
    showMobileReader: isMobile && isReading,
    showDesktop: !isMobile && !isReading,
    showDesktopReader: !isMobile && isReading,
  };
}
