import { describe, it, expect } from 'vite-plus/test';
import { findCrossChapterNext, findCrossChapterPrev } from '../navigation';
import type { Chapter, KnowledgePoint } from '../types';

const chapters: Chapter[] = [
  { id: 3, chapter_no: 3, title: '三', summary: '' },
  { id: 1, chapter_no: 1, title: '一', summary: '' },
  { id: 2, chapter_no: 2, title: '二', summary: '' },
  { id: 4, chapter_no: 4, title: '四', summary: '' },
];

function point(id: number, chapterId: number): KnowledgePoint {
  return { id, chapter_id: chapterId, title: `p${id}`, content: '', sort_order: id };
}

function lookup(entries: Record<number, KnowledgePoint[] | undefined>) {
  return (chapterId: number) => entries[chapterId];
}

describe('findCrossChapterNext', () => {
  it('moves to the next point inside the same chapter', () => {
    const getPoints = lookup({
      1: [point(11, 1), point(12, 1)],
      2: [point(21, 2)],
    });
    expect(findCrossChapterNext(1, 11, chapters, getPoints)).toEqual({ chapterId: 1, pointId: 12 });
  });

  it('continues into the next chapter from the last point of chapter 1 (I-02)', () => {
    const getPoints = lookup({
      1: [point(11, 1), point(12, 1)],
      2: [point(21, 2), point(22, 2)],
    });
    expect(findCrossChapterNext(1, 12, chapters, getPoints)).toEqual({ chapterId: 2, pointId: 21 });
  });

  it('targets the next chapter without a point while its points are still loading', () => {
    const getPoints = lookup({ 1: [point(11, 1)] });
    expect(findCrossChapterNext(1, 11, chapters, getPoints)).toEqual({ chapterId: 2 });
  });

  it('returns null at the very end of the last chapter', () => {
    const getPoints = lookup({
      1: [point(11, 1)],
      2: [point(21, 2)],
      3: [point(31, 3)],
      4: [point(41, 4)],
    });
    expect(findCrossChapterNext(4, 41, chapters, getPoints)).toBeNull();
  });

  it('skips chapters that loaded as empty', () => {
    const getPoints = lookup({
      1: [point(11, 1)],
      2: [],
      3: [point(31, 3)],
    });
    expect(findCrossChapterNext(1, 11, chapters, getPoints)).toEqual({ chapterId: 3, pointId: 31 });
  });

  it('does not skip chapters when reading a non-adjacent expanded chapter', () => {
    // Chapter 4 expanded (loaded) while reading chapter 1: next stays chapter 2.
    const getPoints = lookup({
      1: [point(11, 1)],
      2: [point(21, 2)],
      4: [point(41, 4)],
    });
    expect(findCrossChapterNext(1, 11, chapters, getPoints)).toEqual({ chapterId: 2, pointId: 21 });
  });

  it('returns null when chapters are unknown', () => {
    expect(findCrossChapterNext(1, 11, undefined, lookup({}))).toBeNull();
  });
});

describe('findCrossChapterPrev', () => {
  it('moves to the previous point inside the same chapter', () => {
    const getPoints = lookup({ 1: [point(11, 1), point(12, 1)] });
    expect(findCrossChapterPrev(1, 12, chapters, getPoints)).toEqual({ chapterId: 1, pointId: 11 });
  });

  it('continues into the last point of the previous chapter from chapter 2', () => {
    const getPoints = lookup({
      1: [point(11, 1), point(12, 1)],
      2: [point(21, 2)],
    });
    expect(findCrossChapterPrev(2, 21, chapters, getPoints)).toEqual({ chapterId: 1, pointId: 12 });
  });

  it('targets the previous chapter without a point while its points are loading', () => {
    const getPoints = lookup({ 2: [point(21, 2)] });
    expect(findCrossChapterPrev(2, 21, chapters, getPoints)).toEqual({ chapterId: 1 });
  });

  it('returns null at the very beginning of the first chapter', () => {
    const getPoints = lookup({ 1: [point(11, 1)], 2: [point(21, 2)] });
    expect(findCrossChapterPrev(1, 11, chapters, getPoints)).toBeNull();
  });

  it('skips chapters that loaded as empty', () => {
    const getPoints = lookup({
      1: [point(11, 1)],
      2: [],
      3: [point(31, 3)],
    });
    expect(findCrossChapterPrev(3, 31, chapters, getPoints)).toEqual({ chapterId: 1, pointId: 11 });
  });
});
