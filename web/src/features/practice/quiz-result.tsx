import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubmitResponse } from './types';

export interface QuizResultProps {
  /** The submit response from /practice/submit. */
  result: SubmitResponse;
}

/**
 * Post-submit explanation card. Shown below the question card after the user
 * submits an answer; surfaces correct_answer_keys + explanation text.
 */
export function QuizResult({ result }: QuizResultProps) {
  const accentClass = result.is_correct
    ? 'border-success/30 bg-success/5'
    : 'border-destructive/30 bg-destructive/5';

  const pillBg = result.is_correct
    ? 'bg-success text-success-foreground'
    : 'bg-destructive text-destructive-foreground';

  const badgeVariant = result.is_correct ? 'success' : 'destructive';

  return (
    <Card role="status" aria-live="polite" className={cn('border-2 animate-fadeIn', accentClass)}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', pillBg)}>
            {result.is_correct ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            ) : (
              <X className="size-3.5" strokeWidth={3} aria-hidden />
            )}
          </span>
          <Badge variant={badgeVariant}>{result.is_correct ? '回答正确' : '回答错误'}</Badge>
          <span className="text-muted-foreground">正确答案:</span>
          <span className="font-semibold text-foreground">
            {result.correct_answer_keys.join(', ')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            解析
          </p>
          <p className="text-sm leading-relaxed text-foreground">{result.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
