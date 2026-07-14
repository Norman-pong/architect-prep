import { createFileRoute } from '@tanstack/react-router';
import { WrongQuestionsPage } from '@/features/practice/wrong-questions';

export const Route = createFileRoute('/_authenticated/wrong-questions/')({
  component: WrongQuestionsPage,
});
