import { createFileRoute } from '@tanstack/react-router';
import { PracticePage } from '@/features/practice/quiz';
import { initialScopeFromSearch, parsePracticeSearch } from '@/features/practice/search';

export const Route = createFileRoute('/_authenticated/practice/')({
  // URL contract: /practice?chapter=<id> preselects that chapter as the scope.
  validateSearch: parsePracticeSearch,
  component: PracticeRoute,
});

function PracticeRoute() {
  const search = Route.useSearch();
  return <PracticePage initialScope={initialScopeFromSearch(search)} />;
}
