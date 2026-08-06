import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test';
import { render, act } from '@testing-library/react';
import { AnimatedNumber } from '../animated-number';

describe('AnimatedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Force reduced-motion = false in jsdom
    window.matchMedia = vi.fn().mockImplementation((_q: string) => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the final value after animation completes', () => {
    const { container } = render(<AnimatedNumber value={42} duration={400} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.textContent).toBe('42');
  });

  it('respects decimals prop', () => {
    const { container } = render(<AnimatedNumber value={1.5} duration={100} decimals={1} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.textContent).toBe('1.5');
  });

  it('skips animation when reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<AnimatedNumber value={99} duration={1000} />);
    // Should render target value immediately, no rAF wait.
    expect(container.textContent).toBe('99');
  });
});
