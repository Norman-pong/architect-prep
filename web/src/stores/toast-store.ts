import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

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

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  add: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/**
 * Add a toast. Dedups the same (msg + variant) within 500ms.
 * Caller passes a fully-formed Toast (id + createdAt stamped here).
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
  // Auto-dismiss
  if (toast.durationMs > 0 && typeof window !== 'undefined') {
    window.setTimeout(() => {
      useToastStore.getState().remove(toast.id);
    }, toast.durationMs);
  }
}
