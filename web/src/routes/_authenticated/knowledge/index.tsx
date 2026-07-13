import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChapterTree } from '@/features/knowledge/chapter-tree';

export const Route = createFileRoute('/_authenticated/knowledge/')({
  component: KnowledgePage,
});

function KnowledgePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">知识体系</h1>
      <Card>
        <CardHeader>
          <CardTitle>章节目录</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterTree />
        </CardContent>
      </Card>
    </div>
  );
}
