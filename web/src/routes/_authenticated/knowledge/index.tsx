import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileOutline } from '@/features/knowledge/mobile-outline';
import { DesktopOutline } from '@/features/knowledge/desktop-outline';
import { PointReader } from '@/features/knowledge/point-reader';
import { ChapterDrawer } from '@/features/knowledge/chapter-drawer';
import { SearchSheet } from '@/features/knowledge/search-sheet';
import { useSetHeader } from '@/components/layout/header-context';
import {
  useChapters,
  useChapterPoints,
  useLearningProgress,
  usePointStatus,
  useSearchKnowledge,
  useRecordView,
  useToggleMastered,
} from '@/features/knowledge/hooks';
import type { KnowledgePoint } from '@/features/knowledge/types';

// ── Search params validation ─────────────────────────

interface KnowledgeSearch {
  chapter?: number;
  point?: number;
  q?: string;
}

function validateSearch(search: Record<string, unknown>): KnowledgeSearch {
  const result: KnowledgeSearch = {};

  if (typeof search.chapter === 'number' && search.chapter > 0) {
    result.chapter = search.chapter;
  } else if (typeof search.chapter === 'string') {
    const n = Number(search.chapter);
    if (!Number.isNaN(n) && n > 0) result.chapter = n;
  }

  if (typeof search.point === 'number' && search.point > 0) {
    result.point = search.point;
  } else if (typeof search.point === 'string') {
    const n = Number(search.point);
    if (!Number.isNaN(n) && n > 0) result.point = n;
  }

  if (typeof search.q === 'string' && search.q.length > 0) {
    result.q = search.q;
  }

  return result;
}

export const Route = createFileRoute('/_authenticated/knowledge/')({
  validateSearch,
  component: KnowledgePage,
});

// ── Media query hook ─────────────────────────────────

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    function handler(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

// ── Main page ────────────────────────────────────────

function KnowledgePage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/knowledge/' });
  const isMobile = useIsMobile();

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search.q ?? '');
  // Track which chapters have been expanded on desktop (to load their points)
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<number>>(new Set());

  // Data queries
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: progress } = useLearningProgress();
  const { data: searchResults, isLoading: searchLoading } = useSearchKnowledge(searchQuery);

  // Current chapter/point from URL
  const currentChapterId = search.chapter;
  const currentPointId = search.point;

  // Push page-level config into the unified Header (rendered by the layout).
  // On reader view (pointId set), hide the page header entirely — the
  // PointReader sticky bar takes over.
  useSetHeader(
    currentPointId
      ? null
      : {
          title: '知识体系',
          actions: (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="搜索"
              >
                <Search className="size-5" />
              </Button>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="目录"
                >
                  <Menu className="size-5" />
                </Button>
              )}
            </>
          ),
        },
  );

  // Load points for current chapter (for reader view + drawer)
  const { data: currentChapterPoints } = useChapterPoints(currentChapterId);

  // Load points for expanded desktop chapters (on-demand)
  const expandedChapterId = Array.from(expandedChapterIds).find((id) => id !== currentChapterId);
  const { data: expandedChapterPoints } = useChapterPoints(expandedChapterId);

  // Load point status for current point
  const { data: pointStatus } = usePointStatus(currentPointId);

  // Mutations
  const recordViewMutation = useRecordView();
  const toggleMasteredMutation = useToggleMastered();

  // Build points map from loaded chapters
  const pointsMap = useMemo(() => {
    const map = new Map<number, KnowledgePoint[]>();
    if (currentChapterPoints && currentChapterId) {
      map.set(currentChapterId, currentChapterPoints);
    }
    if (expandedChapterPoints && expandedChapterId) {
      map.set(expandedChapterId, expandedChapterPoints);
    }
    return map;
  }, [currentChapterPoints, currentChapterId, expandedChapterPoints, expandedChapterId]);

  // Build mastered status map from progress.mastered_point_ids (bulk) + pointStatus (current)
  const pointStatusMap = useMemo(() => {
    const map = new Map<number, boolean>();
    // Use mastered_point_ids from progress for bulk mastery status
    if (progress?.mastered_point_ids) {
      for (const id of progress.mastered_point_ids) {
        map.set(id, true);
      }
    }
    // Override with the specific point status if available (more up-to-date)
    if (pointStatus) {
      map.set(pointStatus.point_id, pointStatus.mastered);
    }
    return map;
  }, [progress?.mastered_point_ids, pointStatus]);

  // Find current chapter and point objects
  const currentChapter = useMemo(
    () => chapters?.find((c) => c.id === currentChapterId),
    [chapters, currentChapterId],
  );

  const currentPoint = useMemo(
    () => currentChapterPoints?.find((p) => p.id === currentPointId),
    [currentChapterPoints, currentPointId],
  );

  // Navigation helpers

  const navigateToPoint = useCallback(
    (chapterId: number, pointId: number) => {
      void navigate({ to: '/knowledge', search: { chapter: chapterId, point: pointId } });
    },
    [navigate],
  );

  // Mobile only: tapping a chapter row jumps to ?chapter=X. The existing
  // useEffect below auto-selects the first point once chapter points load.
  const navigateToChapter = useCallback(
    (chapterId: number) => {
      void navigate({ to: '/knowledge', search: { chapter: chapterId } });
    },
    [navigate],
  );

  const navigateBack = useCallback(() => {
    void navigate({ to: '/knowledge', search: {} });
  }, [navigate]);

  const handleContinue = useCallback(() => {
    if (progress?.last_progress) {
      navigateToPoint(progress.last_progress.chapter_id, progress.last_progress.point_id);
    }
  }, [progress, navigateToPoint]);

  const handleToggleMastered = useCallback(
    (pointId: number, mastered: boolean) => {
      toggleMasteredMutation.mutate({ pointId, mastered });
    },
    [toggleMasteredMutation.mutate],
  );

  const handleRecordView = useCallback(
    (pointId: number) => {
      recordViewMutation.mutate(pointId);
    },
    [recordViewMutation.mutate],
  );

  const handleExpandChapter = useCallback((chapterId: number) => {
    setExpandedChapterIds((prev) => new Set(prev).add(chapterId));
  }, []);

  // Determine view mode
  const isReading = !!currentPointId && !!currentChapterId;
  const showMobileOutline = isMobile && !isReading;
  const showMobileReader = isMobile && isReading;
  const showDesktop = !isMobile && !isReading;
  // B-013 fix: PC 端之前只渲染 DesktopOutline，点击 point 后 URL 变成
  // ?chapter=X&point=Y 但 main area 没切换（isReading=true 但 PC 没渲染
  // PointReader 分支），用户体感是"点 article 没反应"。改成 isReading 时
  // 切换到 PointReader 视图（与 mobile 端同形态），用 navigateBack 返回
  // DesktopOutline 列表。
  const showDesktopReader = !isMobile && isReading;

  // Sync search query from URL
  useEffect(() => {
    if (search.q) {
      setSearchQuery(search.q);
    }
  }, [search.q]);
  // Auto-navigate to first point when a chapter is selected on mobile without a point
  useEffect(() => {
    if (
      isMobile &&
      currentChapterId &&
      !currentPointId &&
      currentChapterPoints &&
      currentChapterPoints.length > 0
    ) {
      navigateToPoint(currentChapterId, currentChapterPoints[0].id);
    }
  }, [isMobile, currentChapterId, currentPointId, currentChapterPoints, navigateToPoint]);

  return (
    <div className="space-y-4">
      {/* Mobile: Outline view */}
      {showMobileOutline && (
        <MobileOutline
          chapters={chapters}
          progress={progress}
          isLoading={chaptersLoading}
          onSelectChapter={navigateToChapter}
          lastProgress={progress?.last_progress ?? null}
          onContinue={handleContinue}
        />
      )}

      {/* Mobile: Reader view */}
      {showMobileReader && (
        <PointReader
          chapter={currentChapter}
          point={currentPoint}
          pointStatus={pointStatus}
          progress={progress}
          chapters={chapters}
          pointsMap={pointsMap}
          isLoading={chaptersLoading}
          onBack={navigateBack}
          onNavigate={navigateToPoint}
          onToggleMastered={handleToggleMastered}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          recordView={handleRecordView}
        />
      )}

      {/* Desktop: Outline with inline reading */}
      {showDesktop && (
        <Card>
          <CardHeader>
            <CardTitle>章节目录</CardTitle>
          </CardHeader>
          <CardContent>
            <DesktopOutline
              chapters={chapters}
              pointsMap={pointsMap}
              progress={progress}
              isLoading={chaptersLoading}
              onToggleMastered={handleToggleMastered}
              onExpandChapter={handleExpandChapter}
              onSelectPoint={navigateToPoint}
              pointStatusMap={pointStatusMap}
            />
          </CardContent>
        </Card>
      )}

      {/* Desktop: Reader view when a point is selected. The same PointReader
          component used on mobile gives us the sticky header/footer + chapter
          progress + cross-chapter prev/next for free. Desktop users tap
          `navigateBack` (the chevron-back in PointReader) to return to the
          outline. */}
      {showDesktopReader && (
        <PointReader
          chapter={currentChapter}
          point={currentPoint}
          pointStatus={pointStatus}
          progress={progress}
          chapters={chapters}
          pointsMap={pointsMap}
          isLoading={chaptersLoading}
          onBack={navigateBack}
          onNavigate={navigateToPoint}
          onToggleMastered={handleToggleMastered}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          recordView={handleRecordView}
        />
      )}

      {/* Chapter drawer (mobile) — conditional render keeps [role=dialog]
          out of the DOM until the user opens it. base-ui Dialog mount
          semantics otherwise leak an empty dialog into the accessibility
          tree on every knowledge page load. */}
      {drawerOpen && (
        <ChapterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          chapters={chapters}
          pointsMap={pointsMap}
          progress={progress}
          currentChapterId={currentChapterId}
          currentPointId={currentPointId}
          onSelect={navigateToPoint}
        />
      )}
      {/* Search sheet — conditional render for the same dialog-leak reason. */}
      {searchOpen && (
        <SearchSheet
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          results={searchResults}
          isLoading={searchLoading}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelect={navigateToPoint}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
