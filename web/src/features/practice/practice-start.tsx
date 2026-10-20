import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, Loader2, Play, RotateCcw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { useSetHeader } from '@/components/layout/header-context';
import { useChapters } from '@/features/knowledge/hooks';
import type { PracticeSession } from './types';
import type { PracticeScope } from './search';

const COUNT_OPTIONS = [20, 50, 100];

export interface PracticeStartProps {
  session: PracticeSession | null;
  /** Scope preselected from `/practice?chapter=<id>` (deep link from the reader). */
  initialScope: PracticeScope;
  /** True while the random-question request is in flight (F12). */
  isStarting: boolean;
  startError: string;
  onStart: (count: number, scope: PracticeScope) => void;
  onContinue: () => void;
  onAbandon: () => void;
}

export function PracticeStart({
  session,
  initialScope,
  isStarting,
  startError,
  onStart,
  onContinue,
  onAbandon,
}: PracticeStartProps) {
  useSetHeader({ title: '刷题练习', subtitle: '随机抽题，每次新挑战' });
  const { data: chapters } = useChapters();
  const [count, setCount] = useState(20);
  const [scope, setScope] = useState<PracticeScope>(initialScope);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Keep the visible selection in sync when the deep link changes while the
  // start page is mounted (reader → /practice?chapter=N).
  useEffect(() => {
    setScope(initialScope);
  }, [initialScope]);

  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const preselectedChapter =
    typeof initialScope === 'number'
      ? chapters?.find((chapter) => chapter.id === initialScope)
      : undefined;

  function startNewPractice() {
    if (isStarting) return;
    onStart(count, scope);
  }

  function handleStartClick() {
    // A saved session is never silently overwritten (F13) — even a 0-answer one.
    if (session) {
      setConfirmOpen(true);
      return;
    }
    startNewPractice();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Continue existing session — rendered for any saved session, including
          one the user opened but never answered (F13). */}
      {session && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="size-4 text-primary" />
              继续练习
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info">{session.config.count} 题练习包</Badge>
              <span className="text-sm text-muted-foreground">
                {answeredCount === 0 ? '尚未开始答题' : `已做 ${answeredCount} 题`} /{' '}
                {session.questions.length} 题
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onContinue} size="lg" className="min-h-[44px] flex-1">
                <Play className="mr-1 size-4" />
                继续答题
              </Button>
              <Button variant="outline" size="lg" onClick={onAbandon} className="min-h-[44px]">
                <Trash2 className="mr-1 size-4" />
                放弃
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New practice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新开练习</CardTitle>
          <CardDescription>随机抽取题目，组成练习包</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* F12: surface a failed start inline; the axios interceptor already
              raised one generic toast, so this is the persistent, readable copy. */}
          {startError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{startError}</span>
            </div>
          )}

          {/* Count selector */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">题量</p>
            <div className="grid grid-cols-3 gap-3">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  data-active={count === n}
                  aria-pressed={count === n}
                  className={cn(
                    'flex min-h-[44px] flex-col items-center gap-1 rounded-lg border-2 p-4 transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]',
                    count === n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  <span className="text-2xl font-bold">{n}</span>
                  <span className="text-xs">题</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope selector — pills are ≥44px tall (F16). */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">范围</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                data-active={scope === 'all'}
                aria-pressed={scope === 'all'}
                className={cn(
                  'inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  scope === 'all'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                全部章节
              </button>
              {chapters
                ?.filter((c) => !c.parent_id)
                .map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setScope(ch.id)}
                    data-active={scope === ch.id}
                    aria-pressed={scope === ch.id}
                    className={cn(
                      'inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      scope === ch.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {ch.title}
                  </button>
                ))}
            </div>
            {typeof initialScope === 'number' && (
              <p className="mt-2 text-xs text-primary">
                已从知识体系预选：{preselectedChapter?.title ?? `第 ${initialScope} 章`}
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="min-h-[44px] w-full"
            onClick={handleStartClick}
            disabled={isStarting}
            aria-busy={isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                准备题目...
              </>
            ) : (
              <>
                <Play className="mr-1 size-4" />
                开始练习
                <ChevronRight className="ml-1 size-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="开始新练习？"
        description="当前还有未完成的练习，开始新练习会放弃它（之后无法继续）。"
        confirmLabel="开始新练习"
        cancelLabel="取消"
        onConfirm={startNewPractice}
      />
    </div>
  );
}
