import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChapterExamLinkProps {
  chapterId: number;
}

/**
 * "本章真题" entry in the reader. The link carries `?chapter=` so the practice
 * start screen preselects this chapter (I-16); the practice URL contract lives
 * in `features/practice/search.ts`.
 */
export function ChapterExamLink({ chapterId }: ChapterExamLinkProps) {
  const navigate = useNavigate();
  const { data: count } = useQuery({
    queryKey: ['practice', 'chapter-count', chapterId],
    queryFn: async () => {
      const resp = await api.get('/practice/questions', {
        params: { chapter_id: chapterId, page: 1, page_size: 1 },
      });
      return resp.data.data.total as number;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!count) return null;

  return (
    <button
      type="button"
      onClick={() => void navigate({ to: '/practice', search: { chapter: chapterId } })}
      className={cn(
        'mx-3 mb-2 flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3',
        'transition-colors hover:bg-muted/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <span className="flex items-center gap-2">
        <FileText className="size-4 text-primary" aria-hidden />
        <span className="text-sm font-medium text-foreground">本章真题</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{count} 题</span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </span>
    </button>
  );
}
