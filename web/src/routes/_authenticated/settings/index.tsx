import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/features/settings';

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsRoute,
});

function SettingsRoute() {
  // Page identity lives inside SettingsPage (features/settings/index.tsx)
  // via useSetHeader. The route file is a thin wrapper.
  return <SettingsPage />;
}
