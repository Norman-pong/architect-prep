import { afterEach, describe, it, expect, vi } from 'vite-plus/test';
import { cleanup, render, screen } from '@testing-library/react';
import { BentoCard, BentoGrid, BentoLinkCard } from '../bento';

afterEach(() => {
  cleanup();
});

describe('BentoGrid', () => {
  it('renders the 2/6 column grid', () => {
    const { container } = render(<BentoGrid data-testid="grid" />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).toContain('md:grid-cols-6');
  });
});

describe('BentoCard', () => {
  it('renders an article element (never a nested Card)', () => {
    render(<BentoCard>content</BentoCard>);
    expect(screen.getByText('content').tagName).toBe('ARTICLE');
  });

  it('applies the requested size, tone and min-height', () => {
    render(
      <BentoCard size="hero" tone="hero" minH="wide">
        hero
      </BentoCard>,
    );
    const tile = screen.getByText('hero');
    expect(tile.className).toContain('md:col-span-4');
    expect(tile.className).toContain('border-primary/30');
    expect(tile.className).toContain('min-h-[240px]');
  });

  it('uses the size default min-height when minH is omitted', () => {
    render(<BentoCard size="stat">stat</BentoCard>);
    expect(screen.getByText('stat').className).toContain('min-h-24');
  });
});

describe('BentoLinkCard', () => {
  it('renders a single focusable anchor and merges className + onClick', () => {
    const onClick = vi.fn();
    render(
      <BentoLinkCard
        size="third"
        className="custom-class"
        onClick={onClick}
        render={<a href="/review" />}
      >
        <span>tile content</span>
      </BentoLinkCard>,
    );
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/review');
    expect(link.className).toContain('custom-class');
    expect(link.className).toContain('md:col-span-2');
    expect(link.textContent).toContain('tile content');
    link.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not nest interactive elements inside the whole-tile link', () => {
    render(
      <BentoLinkCard render={<a href="/review" />}>
        <span>static cta</span>
      </BentoLinkCard>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
