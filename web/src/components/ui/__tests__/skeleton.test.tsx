// web/src/components/ui/__tests__/skeleton.test.tsx
import { describe, it, expect } from 'vite-plus/test';
import { render } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('renders with default text variant (h=16px inline, w=100% inline, r=4 → rounded class)', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('16px');
    expect(el.style.width).toBe('100%');
    expect(el).toHaveClass('rounded'); // 4px → rounded
    expect(el).toHaveClass('animate-shimmer');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-label', '加载中');
  });

  it('circle variant defaults to w=h=40px inline + rounded-full class', () => {
    const { container } = render(<Skeleton variant="circle" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('40px');
    expect(el.style.width).toBe('40px');
    expect(el).toHaveClass('rounded-full');
  });

  it('explicit w/h override defaults', () => {
    const { container } = render(<Skeleton variant="rect" w={120} h={32} r={8} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
    expect(el).toHaveClass('rounded-lg'); // r=8 = rounded-lg
  });

  it('passes className through', () => {
    const { container } = render(<Skeleton className="ml-auto" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('ml-auto');
  });
});
