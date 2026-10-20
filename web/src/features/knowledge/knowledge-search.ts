/** URL contract for the knowledge page: `?chapter=<id>&point=<id>&q=<query>`. */
export interface KnowledgeSearch {
  chapter?: number;
  point?: number;
  q?: string;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function validateKnowledgeSearch(search: Record<string, unknown>): KnowledgeSearch {
  const result: KnowledgeSearch = {};
  const chapter = parsePositiveInt(search.chapter);
  if (chapter !== undefined) result.chapter = chapter;
  const point = parsePositiveInt(search.point);
  if (point !== undefined) result.point = point;
  if (typeof search.q === 'string' && search.q.length > 0) result.q = search.q;
  return result;
}
