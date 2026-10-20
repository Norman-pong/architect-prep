/** Number of results rendered per "page" inside the search sheet. */
export const SEARCH_RESULT_PAGE_SIZE = 30;

/** Max characters of plain-text excerpt shown under each search result. */
export const SEARCH_EXCERPT_LENGTH = 160;

/**
 * Collapse raw Markdown (knowledge point content) into a single plain-text line
 * for search result previews. Rendering the raw source leaked `##`, `**` and
 * ```` ```mermaid ```` blocks into the UI (I-15).
 */
export function toPlainText(markdown: string): string {
  let text = markdown ?? '';

  // Fenced code blocks (incl. mermaid) are noise in a one-line preview.
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/~~~[\s\S]*?~~~/g, ' ');
  text = text.replace(/`([^`]*)`/g, '$1');
  // Images before links: keep alt text.
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Headings, blockquotes, list markers, table separator rows.
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  text = text.replace(/^\s{0,3}>\s?/gm, '');
  text = text.replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '');
  text = text.replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, ' ');
  // Inline emphasis, html tags, footnote refs / definitions.
  text = text.replace(/\*\*|__|~~/g, '');
  text = text.replace(/<\/?[^>]+>/g, ' ');
  text = text.replace(/\[\^\d+\]/g, '');
  text = text.replace(/[*_]/g, '');
  text = text.replace(/\|/g, ' ');

  return text.replace(/\s+/g, ' ').trim();
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Split `text` into plain/matched segments for safe React rendering (no HTML). */
export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const needle = query.trim();
  if (!needle || !text) return [{ text, match: false }];

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  // Keep the original index when computing parity: a leading/trailing empty
  // segment is dropped from the output but must not shift odd/even matching.
  return parts
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

/** Plain-text excerpt used by the search result rows. */
export function searchExcerpt(content: string): string {
  const plain = toPlainText(content);
  if (plain.length <= SEARCH_EXCERPT_LENGTH) return plain;
  return `${plain.slice(0, SEARCH_EXCERPT_LENGTH).trimEnd()}…`;
}
