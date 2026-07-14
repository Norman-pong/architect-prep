import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Markdown } from '@/components/markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Chapter {
  id: number;
  chapter_no: number;
  title: string;
  summary: string;
}

interface KnowledgePoint {
  id: number;
  chapter_id: number;
  title: string;
  content: string;
  sort_order: number;
}

export function ChapterTree() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const {
    data: chapters,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chapters'],
    queryFn: async () => {
      const resp = await api.get('/knowledge/chapters');
      return resp.data.data as Chapter[];
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading chapters...</p>;
  }

  if (error) {
    return (
      <p className="text-muted-foreground">
        Unable to load chapters. Make sure the backend is running.
      </p>
    );
  }

  if (!chapters || chapters.length === 0) {
    return <p className="text-muted-foreground">No chapters yet. Run seed to import data.</p>;
  }

  return (
    <div className="space-y-2">
      {chapters.map((ch) => (
        <div key={ch.id}>
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === ch.id ? null : ch.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50',
              expandedId === ch.id && 'border-primary bg-muted/30',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              {ch.chapter_no}
            </span>
            <div className="flex-1">
              <div className="font-medium text-foreground">{ch.title}</div>
              {ch.summary && <p className="mt-0.5 text-xs text-muted-foreground">{ch.summary}</p>}
            </div>
            <span className="text-muted-foreground">{expandedId === ch.id ? '−' : '+'}</span>
          </button>

          {expandedId === ch.id && <ChapterPoints chapterId={ch.id} />}
        </div>
      ))}
    </div>
  );
}

function ChapterPoints({ chapterId }: { chapterId: number }) {
  const { data: points, isLoading } = useQuery({
    queryKey: ['knowledge-points', chapterId],
    queryFn: async () => {
      const resp = await api.get(`/knowledge/chapters/${chapterId}/points`);
      return resp.data.data as KnowledgePoint[];
    },
  });

  if (isLoading) {
    return <p className="py-3 pl-11 text-sm text-muted-foreground">Loading points...</p>;
  }

  if (!points || points.length === 0) {
    return <p className="py-3 pl-11 text-sm text-muted-foreground">No knowledge points.</p>;
  }

  return (
    <div className="space-y-2 py-2 pl-11">
      {points.map((pt, idx) => (
        <Card key={pt.id}>
          <CardContent className="space-y-2 p-3">
            <div className="flex items-start gap-2">
              <Badge variant="info" className="shrink-0">
                {idx + 1}
              </Badge>
              <h4 className="text-sm font-semibold text-foreground">{pt.title}</h4>
            </div>
            <Markdown content={pt.content} skipFirstHeading />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
