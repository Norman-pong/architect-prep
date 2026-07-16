import { createFileRoute } from '@tanstack/react-router';
import { ReviewPage } from '@/features/review/review-page';

export const Route = createFileRoute('/_authenticated/review/')({
  // Page identity lives inside ReviewPage (features/review/review-page.tsx)
  // via useSetHeader. The route file is intentionally a pass-through.
  component: ReviewPage,
});
