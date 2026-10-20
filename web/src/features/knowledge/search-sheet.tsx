import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SEARCH_RESULT_PAGE_SIZE, highlightSegments, searchExcerpt } from './search-utils';
import type { KnowledgePoint } from './types';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const SEARCH_DEBOUNCE_MS = 250;

interface SearchSheetProps {
  open: boolean;
  onClose: () => void;
  results: KnowledgePoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (chapterId: number, pointId: number) => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = useMemo(() => highlightSegments(text, query), [text, query]);
  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded-[2px] bg-warning/30 px-0.5 text-foreground">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Knowledge search overlay. Reuses the shared Base UI dialog primitive for focus
 * trapping / focus return / Escape / scroll lock and an entrance animation
 * (I-13). Bottom sheet on mobile, centered dialog on desktop — one popup, no
 * JS media-query branching.
 */
export function SearchSheet({
  open,
  onClose,
  results,
  isLoading,
  isError,
  onRetry,
  query,
  onQueryChange,
  onSelect,
}: SearchSheetProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const [visibleCount, setVisibleCount] = useState(SEARCH_RESULT_PAGE_SIZE);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external (URL-backed) query — also resets the input after a close.
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Debounced query propagation (kept at 250ms).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQueryChange(localQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery, onQueryChange]);

  // A new query starts a fresh result page.
  useEffect(() => {
    setVisibleCount(SEARCH_RESULT_PAGE_SIZE);
  }, [query]);

  const trimmedQuery = query.trim();
  const totalResults = results?.length ?? 0;
  const visibleResults = results?.slice(0, visibleCount) ?? [];
  const remainingResults = Math.max(0, totalResults - visibleResults.length);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          initialFocus={inputRef}
          className={cn(
            'fixed bottom-0 left-0 right-0 top-auto flex max-h-[85dvh] w-full max-w-none',
            'translate-x-0 translate-y-0 flex-col gap-0 rounded-t-xl rounded-b-none border-0 bg-card p-0 shadow-xl',
            'md:bottom-0 md:left-0 md:right-0 md:top-0 md:m-auto md:h-fit md:max-h-[70dvh] md:w-[calc(100%-2rem)] md:max-w-2xl md:rounded-xl md:border',
            'transition-[opacity,translate] duration-200 ease-out',
            'data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
            'md:data-[starting-style]:translate-y-0 md:data-[ending-style]:translate-y-0',
          )}
        >
          <DialogTitle className="sr-only">搜索知识点</DialogTitle>

          {/* Mobile sheet handle (decorative) */}
          <div className="flex shrink-0 justify-center py-2 md:hidden" aria-hidden>
            <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <label htmlFor="knowledge-search-input" className="sr-only">
              搜索知识点
            </label>
            <Input
              ref={inputRef}
              id="knowledge-search-input"
              inputSize="lg"
              type="search"
              placeholder="搜索知识点…"
              value={localQuery}
              onChange={(event) => setLocalQuery(event.target.value)}
              className="flex-1"
              autoComplete="off"
            />
            <DialogClose
              aria-label="关闭搜索"
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted',
                FOCUS_RING,
              )}
            >
              <X className="size-5" aria-hidden />
            </DialogClose>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4" role="status" aria-label="搜索中" aria-busy="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rect" w="100%" h={56} r={6} />
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <ErrorState
                  compact
                  title="搜索失败"
                  description="搜索请求未能完成，请检查网络后重试。"
                  onRetry={onRetry}
                />
              </div>
            ) : trimmedQuery.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Search className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">输入关键词搜索知识点。</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">没找到相关知识点，试试别的关键词。</p>
              </div>
            ) : (
              <>
                <p
                  className="px-4 pt-3 text-xs text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {remainingResults > 0
                    ? `共 ${totalResults} 条结果，已显示 ${visibleResults.length} 条`
                    : `共 ${totalResults} 条结果`}
                </p>
                <div className="divide-y divide-border">
                  {visibleResults.map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => onSelect(point.chapter_id, point.id)}
                      className={cn(
                        'flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                        FOCUS_RING,
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          <HighlightedText text={point.title} query={trimmedQuery} />
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          <HighlightedText
                            text={searchExcerpt(point.content)}
                            query={trimmedQuery}
                          />
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  ))}
                </div>
                {remainingResults > 0 && (
                  <div className="p-4">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + SEARCH_RESULT_PAGE_SIZE)}
                      className={cn(
                        'flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-transparent text-sm font-medium text-foreground',
                        'transition-colors hover:bg-muted',
                        FOCUS_RING,
                      )}
                    >
                      显示更多（剩余 {remainingResults} 条）
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
