import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/** Reasons that keep a toast's auto-dismiss countdown paused. */
export type ToastPauseReason = 'hover' | 'focus';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  durationMs: number;
  createdAt: number;
}

interface ToastStoreState {
  toasts: Toast[];
  add: (t: Toast) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 3500;
const DEDUP_WINDOW_MS = 500;

/** Auto-dismiss bookkeeping — kept outside React state so pause/resume doesn't re-render. */
interface DismissTimer {
  timeoutId: number;
  startedAt: number;
  remainingMs: number;
}

const dismissTimers = new Map<string, DismissTimer>();

/**
 * Pause holders per toast (hover / focus). The countdown stays stopped until
 * every reason is released, so hovering out while the close button is still
 * focused (or vice versa) never restarts the timer early.
 */
const pauseReasons = new Map<string, Set<ToastPauseReason>>();

function clearDismissTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (timer) {
    if (timer.timeoutId) window.clearTimeout(timer.timeoutId);
    dismissTimers.delete(id);
  }
  pauseReasons.delete(id);
}

function scheduleDismiss(id: string, remainingMs: number) {
  if (typeof window === 'undefined') return;
  if (remainingMs <= 0) {
    useToastStore.getState().remove(id);
    return;
  }
  const timeoutId = window.setTimeout(() => {
    dismissTimers.delete(id);
    useToastStore.getState().remove(id);
  }, remainingMs);
  dismissTimers.set(id, { timeoutId, startedAt: Date.now(), remainingMs });
}

function pauseDismissTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (!timer || timer.timeoutId === 0) return;
  window.clearTimeout(timer.timeoutId);
  timer.remainingMs = Math.max(0, timer.remainingMs - (Date.now() - timer.startedAt));
  timer.timeoutId = 0;
}

function resumeDismissTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (!timer || timer.timeoutId !== 0) return;
  scheduleDismiss(id, timer.remainingMs);
}

/** Stop a toast's auto-dismiss countdown for `reason` (hover / focus). */
export function pauseToastTimer(id: string, reason: ToastPauseReason) {
  const reasons = pauseReasons.get(id) ?? new Set<ToastPauseReason>();
  reasons.add(reason);
  pauseReasons.set(id, reasons);
  pauseDismissTimer(id);
}

/** Release one pause reason; the countdown only resumes once no reason is left. */
export function resumeToastTimer(id: string, reason: ToastPauseReason) {
  const reasons = pauseReasons.get(id);
  if (!reasons) return;
  reasons.delete(reason);
  if (reasons.size > 0) return;
  pauseReasons.delete(id);
  resumeDismissTimer(id);
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  add: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
  remove: (id) => {
    clearDismissTimer(id);
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
  },
  clear: () => {
    dismissTimers.forEach((timer) => {
      if (timer.timeoutId) window.clearTimeout(timer.timeoutId);
    });
    dismissTimers.clear();
    pauseReasons.clear();
    set({ toasts: [] });
  },
}));

/**
 * Add a toast. Dedups the same (msg + variant) within 500ms.
 * Caller passes a fully-formed Toast (id + createdAt stamped here).
 * `durationMs <= 0` opts out of auto-dismiss.
 */
export function addToast(input: {
  variant: ToastVariant;
  message: string;
  description?: string;
  durationMs?: number;
}) {
  const now = Date.now();
  const existing = useToastStore
    .getState()
    .toasts.find((t) => t.message === input.message && t.variant === input.variant);
  if (existing && now - existing.createdAt < DEDUP_WINDOW_MS) {
    return;
  }
  const toast: Toast = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t-${now}-${Math.random().toString(36).slice(2, 8)}`,
    variant: input.variant,
    message: input.message,
    description: input.description,
    durationMs: input.durationMs ?? DEFAULT_DURATION,
    createdAt: now,
  };
  useToastStore.getState().add(toast);
  if (toast.durationMs > 0) scheduleDismiss(toast.id, toast.durationMs);
}
