import { createFileRoute } from '@tanstack/react-router';
import { StatsPage } from '@/features/practice/stats';

export const Route = createFileRoute('/_authenticated/stats/')({
  component: StatsPage,
});
