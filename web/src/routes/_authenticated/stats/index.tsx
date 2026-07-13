import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/stats/')({
  component: StatsPage,
});

function StatsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>学习统计</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">学习数据统计功能开发中...</p>
      </CardContent>
    </Card>
  );
}
