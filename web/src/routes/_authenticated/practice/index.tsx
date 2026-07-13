import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/practice/')({
  component: PracticePage,
});

function PracticePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>刷题练习</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">题库练习功能开发中...</p>
      </CardContent>
    </Card>
  );
}
