import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/wrong-questions/')({
  component: WrongQuestionsPage,
});

function WrongQuestionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>错题本</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">错题记录功能开发中...</p>
      </CardContent>
    </Card>
  );
}
