import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuizOptionProps {
  /** A/B/C/D letter shown in the left pill. */
  letterKey: string;
  /** Full option text. */
  label: string;
  /** Selected by the user (pre-submit). */
  isSelected: boolean;
  /** After submit: this option is one of `correct_answer_keys`. */
  isCorrect: boolean;
  /** After submit: user selected this option but it's wrong. */
  isWrongSelected: boolean;
  /** After submit: full result is rendered (drives color states). */
  showResult: boolean;
  /** Disabled (e.g. after submit). */
  disabled: boolean;
  /** Toggle handler — receives the option's letter key. */
  onToggle: (letterKey: string) => void;
}

/**
 * One answer choice in the quiz. Pre-submit behaves like a toggle/radio;
 * post-submit renders success / failure / neutral visual states.
 */
export function QuizOption({
  letterKey,
  label,
  isSelected,
  isCorrect,
  isWrongSelected,
  showResult,
  disabled,
  onToggle,
}: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(letterKey)}
      disabled={disabled}
      data-state={
        showResult
          ? isCorrect
            ? 'correct'
            : isWrongSelected
              ? 'wrong'
              : isSelected
                ? 'selected'
                : 'neutral'
          : isSelected
            ? 'selected'
            : 'idle'
      }
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-200',
        'hover:scale-[1.005] hover:shadow-sm active:scale-[0.998]',
        showResult && isCorrect && 'border-success bg-success/15 text-success shadow-sm',
        showResult &&
          isWrongSelected &&
          'border-destructive bg-destructive/15 text-destructive shadow-sm',
        !showResult && isSelected && 'border-primary bg-primary/10 shadow-sm',
        !showResult && !isSelected && 'border-border hover:border-primary/40 hover:bg-primary/5',
        showResult && !isCorrect && !isWrongSelected && 'border-border opacity-60',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors',
          showResult && isCorrect && 'border-success bg-success text-success-foreground',
          showResult &&
            isWrongSelected &&
            'border-destructive bg-destructive text-destructive-foreground',
          !showResult && isSelected && 'border-primary bg-primary text-primary-foreground',
          !showResult && !isSelected && 'border-border bg-background text-muted-foreground',
        )}
      >
        {showResult && isCorrect ? (
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        ) : showResult && isWrongSelected ? (
          <X className="size-3.5" strokeWidth={3} aria-hidden />
        ) : (
          letterKey
        )}
      </span>
      <span className="flex-1 font-medium">{label}</span>
    </button>
  );
}
