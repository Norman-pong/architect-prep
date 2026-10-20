/**
 * `/practice?chapter=<id>` search contract.
 *
 * Chapter-deep links from the knowledge reader ("本章真题") preselect that
 * chapter as the practice scope. The URL is kept after starting a practice
 * (not cleared) so the scope survives an accidental refresh and the result can
 * be shared; the start card simply stays on that chapter the next time the
 * user lands back on it.
 */
export interface PracticeSearch {
  chapter?: number;
}

/** Validate/normalise the raw router search into a chapter id when possible. */
export function parsePracticeSearch(search: Record<string, unknown>): PracticeSearch {
  const raw = search.chapter;
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim() !== ''
        ? Number(raw)
        : NaN;
  if (!Number.isInteger(value) || value <= 0) return {};
  return { chapter: value };
}

/** Scope value accepted by the practice runner. */
export type PracticeScope = 'all' | number;

/** Map validated search into the runner's initial scope. */
export function initialScopeFromSearch(search: PracticeSearch): PracticeScope {
  return search.chapter ?? 'all';
}
