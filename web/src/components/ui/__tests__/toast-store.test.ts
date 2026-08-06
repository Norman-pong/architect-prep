import { describe, it, expect, beforeEach, vi } from 'vite-plus/test';
import { useToastStore, addToast } from '@/stores/toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    useToastStore.getState().clear();
    vi.useFakeTimers();
  });

  it('adds a toast', () => {
    addToast({ variant: 'success', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].variant).toBe('success');
    expect(useToastStore.getState().toasts[0].message).toBe('hi');
  });

  it('dedups same (msg+variant) within 500ms', () => {
    addToast({ variant: 'success', message: 'hi' });
    addToast({ variant: 'success', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('does not dedup different variants', () => {
    addToast({ variant: 'success', message: 'hi' });
    addToast({ variant: 'info', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it('does not dedup after dedup window expires', () => {
    addToast({ variant: 'success', message: 'hi' });
    vi.advanceTimersByTime(600);
    addToast({ variant: 'success', message: 'hi' });
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it('auto-removes after durationMs', () => {
    addToast({ variant: 'success', message: 'hi', durationMs: 1000 });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
