// web/src/components/ui/toast.tsx
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ToastVariant,
  useToastStore,
  addToast,
  pauseToastTimer,
  resumeToastTimer,
} from '@/stores/toast-store';

// Public API (consumed by features)
export const toast = {
  success: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'success', message, ...opts }),
  error: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'error', message, ...opts }),
  info: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'info', message, ...opts }),
  warning: (message: string, opts?: { description?: string; durationMs?: number }) =>
    addToast({ variant: 'warning', message, ...opts }),
};

interface ToastProps {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success/40 bg-card text-foreground',
  error: 'border-destructive/40 bg-card text-foreground',
  info: 'border-info/40    bg-card text-foreground',
  warning: 'border-warning/40 bg-card text-foreground',
};

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  success: 'bg-success',
  error: 'bg-destructive',
  info: 'bg-info',
  warning: 'bg-warning',
};

export function Toast({ id, variant, message, description }: ToastProps) {
  const { t } = useTranslation();
  const remove = useToastStore((s) => s.remove);
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => pauseToastTimer(id, 'hover')}
      onMouseLeave={() => resumeToastTimer(id, 'hover')}
      onFocusCapture={() => pauseToastTimer(id, 'focus')}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        resumeToastTimer(id, 'focus');
      }}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-card px-4 py-3 shadow-lg animate-fadeIn',
        VARIANT_STYLES[variant],
      )}
    >
      <span
        aria-hidden
        className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', VARIANT_ACCENT[variant])}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {/* 44px touch target; negative margins keep the visual density unchanged. */}
      <button
        type="button"
        onClick={() => remove(id)}
        aria-label={t('a11y.closeToast')}
        className="ml-1 -my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
