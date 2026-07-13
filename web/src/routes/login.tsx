import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { LoginPage } from '@/features/auth';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});
