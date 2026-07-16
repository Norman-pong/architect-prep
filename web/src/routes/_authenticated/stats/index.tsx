import { createFileRoute } from '@tanstack/react-router';
import { StatsPage } from '@/features/practice/stats';

export const Route = createFileRoute('/_authenticated/stats/')({
  // Page identity lives inside StatsPage (features/practice/stats.tsx)
  // via useSetHeader. The route file is intentionally a pass-through.
  component: StatsPage,
});
