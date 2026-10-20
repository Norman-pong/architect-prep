import { describe, it, expect, beforeEach, afterEach, vi } from 'vite-plus/test';
import { useToastStore, addToast, pauseToastTimer, resumeToastTimer } from '@/stores/toast-store';

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

describe('toast-store pause/resume', () => {
  beforeEach(() => {
    useToastStore.getState().clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function addPausedToast(message: string): string {
    addToast({ variant: 'success', message, durationMs: 1000 });
    const id = useToastStore.getState().toasts[0]?.id;
    expect(id).toBeTruthy();
    return id ?? '';
  }

  it('pauses while hovered and resumes with the remaining time on mouse leave', () => {
    const id = addPausedToast('pause-hover');
    pauseToastTimer(id, 'hover');

    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    resumeToastTimer(id, 'hover');
    vi.advanceTimersByTime(999);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(2);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('stays paused until both hover and focus are released (hover released first)', () => {
    const id = addPausedToast('pause-hover-focus');
    pauseToastTimer(id, 'hover');
    pauseToastTimer(id, 'focus');

    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    // Mouse leaves while the close button is still focused: focus keeps it paused.
    resumeToastTimer(id, 'hover');
    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    // Focus leaves too: the countdown restarts and consumes the remaining time.
    resumeToastTimer(id, 'focus');
    vi.advanceTimersByTime(1000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('stays paused until both hover and focus are released (focus released first)', () => {
    const id = addPausedToast('pause-focus-hover');
    pauseToastTimer(id, 'focus');
    pauseToastTimer(id, 'hover');

    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    resumeToastTimer(id, 'focus');
    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    resumeToastTimer(id, 'hover');
    vi.advanceTimersByTime(1000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('is a no-op for unknown toast ids', () => {
    expect(() => {
      pauseToastTimer('missing', 'hover');
      pauseToastTimer('missing', 'focus');
      resumeToastTimer('missing', 'hover');
      resumeToastTimer('missing', 'focus');
    }).not.toThrow();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('clears pause bookkeeping when the toast is removed', () => {
    const id = addPausedToast('pause-removed');
    pauseToastTimer(id, 'hover');
    useToastStore.getState().remove(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
    // Releasing a reason for an already-removed toast must not throw or re-add it.
    resumeToastTimer(id, 'hover');
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
