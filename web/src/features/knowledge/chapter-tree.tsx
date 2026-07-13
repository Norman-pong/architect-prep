import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Chapter {
  id: number;
  chapter_no: number;
  title: string;
  summary: string;
}

export function ChapterTree() {
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
    return (
      <p className="text-muted-foreground">No chapters yet. Knowledge data needs to be imported.</p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {chapters.map((ch) => (
        <div
          key={ch.id}
          className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <div className="mb-1 text-sm font-semibold text-muted-foreground">
            Chapter {ch.chapter_no}
          </div>
          <div className="font-medium text-foreground">{ch.title}</div>
          {ch.summary && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ch.summary}</p>
          )}
        </div>
      ))}
    </div>
  );
}
