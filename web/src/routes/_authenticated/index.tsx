import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">系统架构师备考平台</h1>
      <p className="text-muted-foreground">知识体系 + 刷题一体化</p>
    </div>
  );
}
