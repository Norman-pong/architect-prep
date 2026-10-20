import { afterEach, describe, it, expect, vi } from 'vite-plus/test';
import { cleanup, render, screen } from '@testing-library/react';
import { PointReader } from '../point-reader';
import type { Chapter, KnowledgePoint } from '../types';

// The exam link needs Router + Query providers; the four-state gate under test
// ends before it renders, so stub the link to keep this a pure unit test.
vi.mock('../chapter-exam-link', () => ({ ChapterExamLink: () => null }));

const chapter: Chapter = { id: 1, chapter_no: 1, title: '绪论', summary: '' };
const point: KnowledgePoint = {
  id: 11,
  chapter_id: 1,
  title: '软件架构',
  content: '## 标题\n\n正文',
  sort_order: 1,
};

afterEach(() => cleanup());

const noop = () => undefined;

function renderReader(overrides: Partial<Parameters<typeof PointReader>[0]> = {}) {
  return render(
    <PointReader
      chapter={undefined}
      point={undefined}
      isMastered={false}
      progress={undefined}
      chapters={[]}
      pointsByChapter={new Map()}
      isLoading={false}
      isError={false}
      onRetry={noop}
      onBack={noop}
      onNavigate={noop}
      onNavigateToChapter={noop}
      onToggleMastered={noop}
      isMasteredPending={false}
      onOpenDrawer={noop}
      onOpenSearch={noop}
      recordView={noop}
      {...overrides}
    />,
  );
}

describe('PointReader four-state gate (I-04)', () => {
  it('shows the loading skeleton while points load — never the not-found copy', () => {
    renderReader({ isLoading: true });
    expect(screen.getByRole('status', { name: '加载知识点中' })).toBeInTheDocument();
    expect(screen.queryByText(/不存在或已删除/)).not.toBeInTheDocument();
  });

  it('shows a retryable error state for failed loads, not not-found', () => {
    const onRetry = vi.fn();
    renderReader({ isError: true, onRetry });
    expect(screen.getByRole('alert')).toHaveTextContent('知识点加载失败');
    expect(screen.queryByText(/不存在或已删除/)).not.toBeInTheDocument();
    screen.getByRole('button', { name: '重试' }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('distinguishes a missing chapter from a missing point', () => {
    const { rerender } = renderReader({});
    expect(screen.getByText('章节不存在或已删除。')).toBeInTheDocument();

    rerender(
      <PointReader
        chapter={chapter}
        point={undefined}
        isMastered={false}
        progress={undefined}
        chapters={[chapter]}
        pointsByChapter={new Map()}
        isLoading={false}
        isError={false}
        onRetry={noop}
        onBack={noop}
        onNavigate={noop}
        onNavigateToChapter={noop}
        onToggleMastered={noop}
        isMasteredPending={false}
        onOpenDrawer={noop}
        onOpenSearch={noop}
        recordView={noop}
      />,
    );
    expect(screen.getByText('知识点不存在或已删除。')).toBeInTheDocument();
  });

  it('renders the article once chapter and point resolve', () => {
    renderReader({
      chapter,
      point,
      chapters: [chapter],
      pointsByChapter: new Map([[chapter.id, [point]]]),
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('1. 绪论');
    expect(screen.getByText('正文')).toBeInTheDocument();
    expect(screen.queryByText(/不存在或已删除/)).not.toBeInTheDocument();
  });
});
