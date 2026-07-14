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

  // Build mastered status map from progress.per_chapter
  // Backend returns per_chapter: [{chapter_id, total, mastered}]
  // We don't have per-point mastered status in the bulk response,
  // so point-level badges are best-effort (fetched on-demand via usePointStatus)
  const pointStatusMap = useMemo(() => {
    const map = new Map<number, boolean>();
    // If we have pointStatus for the current point, include it
    if (pointStatus) {
      map.set(pointStatus.point_id, pointStatus.mastered);
    }
    return map;
  }, [pointStatus]);

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
  const navigateToChapter = useCallback(
    (chapterId: number) => {
      void navigate({ to: '/knowledge', search: { chapter: chapterId } });
    },
    [navigate],
  );

  const navigateToPoint = useCallback(
    (chapterId: number, pointId: number) => {
      void navigate({ to: '/knowledge', search: { chapter: chapterId, point: pointId } });
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
    [toggleMasteredMutation],
  );

  const handleRecordView = useCallback(
    (pointId: number) => {
      recordViewMutation.mutate(pointId);
    },
    [recordViewMutation],
  );

  const handleExpandChapter = useCallback((chapterId: number) => {
    setExpandedChapterIds((prev) => new Set(prev).add(chapterId));
  }, []);

  // Determine view mode
  const isReading = !!currentPointId && !!currentChapterId;
  const showMobileOutline = isMobile && !isReading;
  const showMobileReader = isMobile && isReading;
  const showDesktop = !isMobile;

  // Sync search query from URL
  useEffect(() => {
    if (search.q) {
      setSearchQuery(search.q);
    }
  }, [search.q]);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">知识体系</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="搜索">
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
        </div>
      </div>

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
              pointStatusMap={pointStatusMap}
            />
          </CardContent>
        </Card>
      )}

      {/* Chapter drawer (mobile) */}
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

      {/* Search sheet */}
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
    </div>
  );
}
