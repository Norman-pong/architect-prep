import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { X, ChevronRight } from 'lucide-react';
import type { KnowledgePoint } from './types';

interface SearchSheetProps {
  open: boolean;
  onClose: () => void;
  results: KnowledgePoint[] | undefined;
  isLoading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (chapterId: number, pointId: number) => void;
  isMobile: boolean;
}

export function SearchSheet({
  open,
  onClose,
  results,
  isLoading,
  query,
  onQueryChange,
  onSelect,
  isMobile,
}: SearchSheetProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external query
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onQueryChange(localQuery);
    }, 250);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localQuery, onQueryChange]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function handleSelect(chapterId: number, pointId: number) {
    onSelect(chapterId, pointId);
    onClose();
  }

  if (!open) return null;

  const content = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Input
          ref={inputRef}
          inputSize="lg"
          placeholder="搜索知识点…"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="flex-1"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          aria-label="关闭"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && localQuery.length > 0 && (!results || results.length === 0) && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">没找到相关知识点，试试别的关键词。</p>
          </div>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="divide-y divide-border">
            {results.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() => handleSelect(pt.chapter_id, pt.id)}
                className="flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{pt.title}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {pt.content.slice(0, 120)}…
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Bottom sheet */}
        <div
          className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] rounded-t-xl bg-card shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="搜索知识点"
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
          </div>
          {content}
        </div>
      </>
    );
  }

  // Desktop: centered dialog
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="搜索知识点"
      >
        {content}
      </div>
    </>
  );
}
