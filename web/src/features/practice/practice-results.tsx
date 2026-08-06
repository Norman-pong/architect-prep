import { useNavigate } from '@tanstack/react-router';
import { Check, X, Minus, RotateCcw, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSetHeader } from '@/components/layout/header-context';
import type { PracticeSession } from './types';

export interface PracticeResultsProps {
  session: PracticeSession;
  onRestart: () => void;
}

export function PracticeResults({ session, onRestart }: PracticeResultsProps) {
  useSetHeader({ title: '练习结果', subtitle: '本次练习完成' });
  const navigate = useNavigate();

  const total = session.questions.length;
  const answered = Object.keys(session.answers).length;
  const correct = Object.values(session.answers).filter((a) => a.result.is_correct).length;
  const wrong = answered - correct;
  const unanswered = total - answered;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  const accentClass =
    accuracy >= 80
      ? 'text-success'
      : accuracy >= 60
        ? 'text-primary'
        : accuracy >= 30
          ? 'text-warning'
          : 'text-destructive';

  const stats = [
    { label: '答对', count: correct, icon: Check, color: 'text-success' },
    { label: '答错', count: wrong, icon: X, color: 'text-destructive' },
    { label: '未答', count: unanswered, icon: Minus, color: 'text-muted-foreground' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Score card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
          <p className="text-sm text-muted-foreground">本次成绩</p>
          <div className="mt-2 flex items-baseline justify-center gap-2">
            <span className={cn('text-5xl font-bold', accentClass)}>{correct}</span>
            <span className="text-2xl text-muted-foreground">/ {total}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">正确率 {accuracy}%</p>
        </div>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 rounded-lg border border-border p-3"
              >
                <s.icon className={cn('size-4', s.color)} />
                <span className="text-xl font-bold">{s.count}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={onRestart}>
          <RotateCcw className="mr-1 size-4" />
          再来一组
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => void navigate({ to: '/wrong-questions' })}
        >
          <ListChecks className="mr-1 size-4" />
          查看错题
        </Button>
      </div>
    </div>
  );
}
