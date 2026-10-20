import { describe, expect, it } from 'vite-plus/test';
import { initialScopeFromSearch, parsePracticeSearch } from '../search';

describe('practice ?chapter= URL contract', () => {
  it('accepts string chapter ids from the URL', () => {
    expect(parsePracticeSearch({ chapter: '7' })).toEqual({ chapter: 7 });
  });

  it('accepts numeric chapter ids (typed search objects)', () => {
    expect(parsePracticeSearch({ chapter: 12 })).toEqual({ chapter: 12 });
  });

  it('ignores invalid values', () => {
    expect(parsePracticeSearch({})).toEqual({});
    expect(parsePracticeSearch({ chapter: 'abc' })).toEqual({});
    expect(parsePracticeSearch({ chapter: '0' })).toEqual({});
    expect(parsePracticeSearch({ chapter: '-3' })).toEqual({});
    expect(parsePracticeSearch({ chapter: '2.5' })).toEqual({});
    expect(parsePracticeSearch({ chapter: '' })).toEqual({});
  });

  it('maps validated search to the runner scope', () => {
    expect(initialScopeFromSearch({ chapter: 7 })).toBe(7);
    expect(initialScopeFromSearch({})).toBe('all');
  });
});
