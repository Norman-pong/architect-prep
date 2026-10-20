import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WrongQuestion } from './types';

export interface RedoResult {
  is_correct: boolean;
  correct_answer_keys: string[];
  explanation: string;
  /**
   * answer_keys snapshot captured at submit time. Highlighting must follow the
   * submitted answer, not later option edits (R3).
   */
  submitted_keys: string[];
}

export interface WrongQuestionCardProps {
  wq: WrongQuestion;
  expanded: boolean;
  /** A redo for THIS question is in flight; other cards stay interactive. */
  pending: boolean;
  result: RedoResult | undefined;
  selectedKeys: string[];
  onToggleExpand: () => void;
  onToggleOption: (key: string, isMultiple: boolean) => void;
  onSubmit: () => void;
  onReset: () => void;
  onCollapse: () => void;
}

/** One wrong-question row: collapsed summary by default, inline redo when expanded. */
export function WrongQuestionCard({
  wq,
  expanded,
  pending,
  result,
  selectedKeys,
  onToggleExpand,
  onToggleOption,
  onSubmit,
  onReset,
  onCollapse,
}: WrongQuestionCardProps) {
  const q = wq.question;
  if (!q) return null;

  const isMultiple = q.question_type === 'multiple';
  const options: string[] = q.options ?? [];
  const answerKeys: string[] = q.answer_keys ?? [];
  // Freeze the user's selection to the submit snapshot once a result exists.
  const highlightedKeys = result?.submitted_keys ?? selectedKeys;
  const locked = pending || !!result;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isMultiple ? (
              <Badge variant="warning">多选</Badge>
            ) : (
              <Badge variant="info">单选</Badge>
            )}
            <Badge variant="success">已加入复习</Badge>
            {result?.is_correct && <Badge variant="success">已订正</Badge>}
            <span className="text-xs text-muted-foreground">
              错题时间: {new Date(wq.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="min-h-[44px]"
            aria-expanded={expanded}
          >
            {expanded ? '收起' : '重做'}
            <RotateCcw className="size-4" aria-hidden />
          </Button>
        </div>
        <CardTitle className="text-base">{q.content}</CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3">
          {options.map((opt) => {
            const key = opt.charAt(0);
            const isSelected = highlightedKeys.includes(key);
            const isCorrect = result?.correct_answer_keys.includes(key);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggleOption(key, isMultiple)}
                disabled={locked}
                className={cn(
                  'flex min-h-[44px] w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:cursor-not-allowed',
                  result && isCorrect && 'border-success bg-success/10 text-success',
                  result &&
                    isSelected &&
                    !isCorrect &&
                    'border-destructive bg-destructive/10 text-destructive',
                  !result && isSelected && 'border-primary bg-primary/5',
                  !result && !isSelected && 'border-border hover:bg-muted/50',
                  !result && pending && 'opacity-60',
                )}
              >
                <span className="font-medium">{opt}</span>
              </button>
            );
          })}

          {result && (
            <div className="rounded-md bg-muted/50 p-3">
              {result.is_correct ? (
                <Badge variant="success">已订正</Badge>
              ) : (
                <Badge variant="destructive">仍然错误</Badge>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                正确答案: {result.correct_answer_keys.join(', ')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{result.explanation}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!result ? (
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={selectedKeys.length === 0 || pending}
                aria-busy={pending}
                className="min-h-[44px]"
              >
                {pending ? '提交中...' : '提交'}
              </Button>
            ) : !result.is_correct ? (
              <Button variant="outline" size="sm" onClick={onReset} className="min-h-[44px]">
                再试一次
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onCollapse} className="min-h-[44px]">
                收起解析
              </Button>
            )}
          </div>

          {answerKeys.length > 0 && !result && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">查看答案</summary>
              <p className="mt-1">正确答案: {answerKeys.join(', ')}</p>
            </details>
          )}
        </CardContent>
      )}
    </Card>
  );
}
