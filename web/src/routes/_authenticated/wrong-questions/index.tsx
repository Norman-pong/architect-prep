import { createFileRoute } from '@tanstack/react-router';
import { WrongQuestionsPage } from '@/features/practice/wrong-questions';

export const Route = createFileRoute('/_authenticated/wrong-questions/')({
  // Page identity lives inside WrongQuestionsPage (features/practice/wrong-questions.tsx)
  // via useSetHeader. The route file is intentionally a pass-through.
  component: WrongQuestionsPage,
});
