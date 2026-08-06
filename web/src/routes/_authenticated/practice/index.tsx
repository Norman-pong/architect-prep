import { createFileRoute } from '@tanstack/react-router';
import { PracticePage } from '@/features/practice/quiz';

export const Route = createFileRoute('/_authenticated/practice/')({
  component: PracticePage,
});
