import { useState } from 'react';
import { RotateCcw, Play, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSetHeader } from '@/components/layout/header-context';
import { useChapters } from '@/features/knowledge/hooks';
import type { PracticeSession } from './types';

const COUNT_OPTIONS = [20, 50, 100];

export interface PracticeStartProps {
  session: PracticeSession | null;
  onStart: (count: number, scope: 'all' | number) => void;
  onContinue: () => void;
  onAbandon: () => void;
}

export function PracticeStart({ session, onStart, onContinue, onAbandon }: PracticeStartProps) {
  useSetHeader({ title: '刷题练习', subtitle: '随机抽题，每次新挑战' });
  const { data: chapters } = useChapters();
  const [count, setCount] = useState(20);
  const [scope, setScope] = useState<'all' | number>('all');

  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const hasProgress =
    session && answeredCount > 0 && session.currentIndex < session.questions.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Continue existing session */}
      {hasProgress && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="size-4 text-primary" />
              继续练习
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info">{session!.config.count} 题练习包</Badge>
              <span className="text-sm text-muted-foreground">
                已做 {answeredCount} / {session!.questions.length} 题
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(answeredCount / session!.questions.length) * 100}%` }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onContinue} size="lg" className="flex-1">
                <Play className="mr-1 size-4" />
                继续答题
              </Button>
              <Button variant="outline" size="lg" onClick={onAbandon}>
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
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border-2 p-4 transition-all',
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

          {/* Scope selector */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">范围</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                data-active={scope === 'all'}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-all',
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
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-sm transition-all',
                      scope === ch.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {ch.title}
                  </button>
                ))}
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={() => onStart(count, scope)}>
            <Play className="mr-1 size-4" />
            开始练习
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
