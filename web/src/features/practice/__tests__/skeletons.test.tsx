import { describe, it, expect } from 'vite-plus/test';
import { render } from '@testing-library/react';
import { StatsSkeleton } from '../stats-skeleton';
import { WrongQuestionsSkeleton } from '../wrong-questions-skeleton';

describe('stats/wrong skeletons (R5)', () => {
  it('StatsSkeleton uses the page max-width container', () => {
    const { container } = render(<StatsSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('mx-auto', 'w-full', 'max-w-5xl');
  });

  it('WrongQuestionsSkeleton uses the page max-width and collapsed-card layout', () => {
    const { container } = render(<WrongQuestionsSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('mx-auto', 'w-full', 'max-w-5xl');
    // 3 collapsed rows; no expanded options in the first screen.
    const cards = root.querySelectorAll(':scope > .rounded-lg');
    expect(cards.length).toBe(3);
  });
});
