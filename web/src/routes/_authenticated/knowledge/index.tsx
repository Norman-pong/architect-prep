import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Search, ListTree } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileOutline } from '@/features/knowledge/mobile-outline';
import { DesktopOutline } from '@/features/knowledge/desktop-outline';
import { PointReader } from '@/features/knowledge/point-reader';
import { ChapterDrawer } from '@/features/knowledge/chapter-drawer';
import { SearchSheet } from '@/features/knowledge/search-sheet';
import { useSetHeader } from '@/components/layout/header-context';
import { useKnowledgePage } from '@/features/knowledge/use-knowledge-page';
import { validateKnowledgeSearch } from '@/features/knowledge/knowledge-search';

export const Route = createFileRoute('/_authenticated/knowledge/')({
  validateSearch: validateKnowledgeSearch,
  component: KnowledgePage,
});

/** Skeleton row fallback: the seeded knowledge base has 20 chapters; once
 *  either query resolves, its real count is used so skeleton height matches the
 *  resolved list (I-20). */
const FALLBACK_CHAPTER_ROWS = 20;

function KnowledgePage() {
  const page = useKnowledgePage();

  const skeletonRows =
    page.chapters?.length ?? page.progress?.per_chapter?.length ?? FALLBACK_CHAPTER_ROWS;

  const headerActions = useMemo(
    () => (
      <>
        <Button variant="ghost" size="icon" onClick={page.openSearch} aria-label="搜索">
          <Search className="size-5" />
        </Button>
        {page.isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => page.setDrawerOpen(true)}
            aria-label="目录"
          >
            <ListTree className="size-5" />
          </Button>
        )}
      </>
    ),
    [page.isMobile, page.openSearch, page.setDrawerOpen],
  );

  // On the reader view the unified Header is hidden — PointReader renders its
  // own sticky top bar.
  useSetHeader(page.isReading ? null : { title: '知识体系', actions: headerActions });

  const readerLoading =
    page.chaptersLoading || (page.currentChapterPointsStatus?.isLoading ?? false);
  const readerError = page.chaptersError || (page.currentChapterPointsStatus?.isError ?? false);

  const handleRetryReader = () => {
    if (page.chaptersError) page.retryChapters();
    if (page.progressError) page.retryProgress();
    if (page.search.chapter !== undefined) page.retryChapterPoints(page.search.chapter);
  };

  const handleDrawerSelectChapter = (chapterId: number) => {
    page.setDrawerOpen(false);
    page.navigateToChapter(chapterId);
  };

  const handleDrawerSelectPoint = (chapterId: number, pointId: number) => {
    page.setDrawerOpen(false);
    page.navigateToPoint(chapterId, pointId);
  };

  return (
    <div className="space-y-4">
      {/* Mobile: chapter list */}
      {page.showMobileOutline && (
        <MobileOutline
          chapters={page.chapters}
          progress={page.progress}
          isLoading={page.chaptersLoading}
          isError={page.chaptersError}
          progressError={page.progressError}
          onRetry={page.retryChapters}
          onRetryProgress={page.retryProgress}
          onSelectChapter={page.navigateToChapter}
          lastProgress={page.progress?.last_progress ?? null}
          onContinue={page.handleContinue}
          skeletonRows={skeletonRows}
        />
      )}

      {/* Reader (mobile + desktop) — constrained reading measure (§3.9) */}
      {(page.showMobileReader || page.showDesktopReader) && (
        <div className="mx-auto w-full max-w-3xl">
          <PointReader
            chapter={page.currentChapter}
            point={page.currentPoint}
            isMastered={
              page.search.point !== undefined
                ? (page.pointStatusMap.get(page.search.point) ?? false)
                : false
            }
            progress={page.progress}
            chapters={page.chapters}
            pointsByChapter={page.pointsByChapter}
            isLoading={readerLoading}
            isError={readerError}
            onRetry={handleRetryReader}
            onBack={page.navigateBack}
            onNavigate={page.navigateToPoint}
            onNavigateToChapter={page.navigateToChapter}
            onToggleMastered={page.handleToggleMastered}
            isMasteredPending={page.pendingMasteredPointId === page.search.point}
            onOpenDrawer={() => page.setDrawerOpen(true)}
            onOpenSearch={page.openSearch}
            recordView={page.handleRecordView}
          />
        </div>
      )}

      {/* Desktop: chapter outline with per-chapter on-demand points */}
      {page.showDesktop && (
        <Card className="mx-auto w-full max-w-6xl">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              章节目录
            </h2>
          </CardHeader>
          <CardContent>
            <DesktopOutline
              chapters={page.chapters}
              pointsByChapter={page.pointsByChapter}
              chapterPointsStatus={page.chapterPointsStatus}
              progress={page.progress}
              isLoading={page.chaptersLoading}
              isError={page.chaptersError}
              progressError={page.progressError}
              onRetryChapters={page.retryChapters}
              onRetryProgress={page.retryProgress}
              expandedChapterIds={page.expandedChapterIds}
              onToggleChapter={page.toggleChapter}
              onExpandAll={page.expandAll}
              onCollapseAll={page.collapseAll}
              onSelectPoint={page.navigateToPoint}
              onToggleMastered={page.handleToggleMastered}
              onRetryChapter={page.retryChapterPoints}
              pointStatusMap={page.pointStatusMap}
              pendingMasteredPointId={page.pendingMasteredPointId}
              skeletonRows={skeletonRows}
            />
          </CardContent>
        </Card>
      )}

      <ChapterDrawer
        open={page.drawerOpen}
        onClose={() => page.setDrawerOpen(false)}
        chapters={page.chapters}
        pointsByChapter={page.pointsByChapter}
        progress={page.progress}
        pointStatusMap={page.pointStatusMap}
        currentChapterId={page.search.chapter}
        currentPointId={page.search.point}
        isLoading={page.chaptersLoading}
        isError={page.chaptersError}
        onRetry={page.retryChapters}
        onSelectChapter={handleDrawerSelectChapter}
        onSelectPoint={handleDrawerSelectPoint}
        skeletonRows={skeletonRows}
      />

      <SearchSheet
        open={page.searchOpen}
        onClose={page.closeSearch}
        results={page.searchResults}
        isLoading={page.searchLoading}
        isError={page.searchError}
        onRetry={page.retrySearch}
        query={page.searchQuery}
        onQueryChange={page.setSearchQuery}
        onSelect={page.selectSearchResult}
      />
    </div>
  );
}
