import { describe, it, expect } from 'vite-plus/test';
import { render } from '@testing-library/react';
import { ReviewCardSkeleton } from '../review-skeleton';

describe('ReviewCardSkeleton (R5)', () => {
  it('uses the resolved page max-width and announces a busy status', () => {
    const { container } = render(<ReviewCardSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('mx-auto', 'w-full', 'max-w-3xl');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-busy', 'true');
  });

  it('mirrors the compact metrics + single card + 2x2 rating layout', () => {
    const { container } = render(<ReviewCardSkeleton />);
    const grids = container.querySelectorAll('.grid');
    // First grid = 4 metric tiles, last grid = 4 rating buttons.
    expect(grids.length).toBeGreaterThanOrEqual(2);
    expect(grids[0]?.children.length).toBe(4);
    expect(grids[grids.length - 1]?.children.length).toBe(4);
  });
});
