import { createFileRoute } from '@tanstack/react-router';
import { PracticePage } from '@/features/practice/quiz';

interface PracticeSearch {
  chapter?: number;
}

function validateSearch(search: Record<string, unknown>): PracticeSearch {
  const result: PracticeSearch = {};
  if (typeof search.chapter === 'number' && search.chapter > 0) {
    result.chapter = search.chapter;
  } else if (typeof search.chapter === 'string') {
    const n = Number(search.chapter);
    if (n > 0) result.chapter = n;
  }
  return result;
}

export const Route = createFileRoute('/_authenticated/practice/')({
  validateSearch,
  component: PracticePage,
});
