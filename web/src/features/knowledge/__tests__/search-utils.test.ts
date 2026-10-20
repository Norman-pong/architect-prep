import { describe, it, expect } from 'vite-plus/test';
import {
  SEARCH_EXCERPT_LENGTH,
  SEARCH_RESULT_PAGE_SIZE,
  highlightSegments,
  searchExcerpt,
  toPlainText,
} from '../search-utils';

describe('toPlainText', () => {
  it('strips heading markers, emphasis and footnote refs', () => {
    expect(toPlainText('## 一致性哈希\n\n**重点**：虚拟节点[^1]')).toBe(
      '一致性哈希 重点：虚拟节点',
    );
  });

  it('drops fenced code blocks including mermaid sources', () => {
    const md = '# 标题\n\n```mermaid\ngraph TD\nA-->B\n```\n\n正文';
    expect(toPlainText(md)).toBe('标题 正文');
  });

  it('keeps link/image alt text and table cell text', () => {
    const md =
      '![架构图](x.png) [参考](https://example.com)\n\n| A | B |\n| --- | --- |\n| 1 | 2 |';
    const text = toPlainText(md);
    expect(text).toContain('架构图');
    expect(text).toContain('参考');
    expect(text).toContain('1 2');
    expect(text).not.toContain('https://example.com');
    expect(text).not.toContain('---');
  });

  it('collapses whitespace into a single line', () => {
    expect(toPlainText('a\n\nb\t c')).toBe('a b c');
  });
});

describe('searchExcerpt', () => {
  it('returns short plain text as-is', () => {
    expect(searchExcerpt('**短**文本')).toBe('短文本');
  });

  it('truncates long content with an ellipsis', () => {
    const excerpt = searchExcerpt('字'.repeat(SEARCH_EXCERPT_LENGTH + 40));
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(SEARCH_EXCERPT_LENGTH + 1);
  });
});

describe('highlightSegments', () => {
  it('marks every case-insensitive match', () => {
    expect(highlightSegments('CAP 定理与 cap 实践', 'cap')).toEqual([
      { text: 'CAP', match: true },
      { text: ' 定理与 ', match: false },
      { text: 'cap', match: true },
      { text: ' 实践', match: false },
    ]);
  });

  it('returns a single plain segment for an empty query', () => {
    expect(highlightSegments('原文', '  ')).toEqual([{ text: '原文', match: false }]);
  });

  it('treats regex specials in the query literally', () => {
    expect(highlightSegments('a.b.c', '.')).toEqual([
      { text: 'a', match: false },
      { text: '.', match: true },
      { text: 'b', match: false },
      { text: '.', match: true },
      { text: 'c', match: false },
    ]);
  });
});

describe('page size', () => {
  it('keeps the result page size at 30', () => {
    expect(SEARCH_RESULT_PAGE_SIZE).toBe(30);
  });
});
