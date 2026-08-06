import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Counts up from 0 to `value` on mount using rAF + easeOutQuart. Only plays
 * once per mount — subsequent prop changes do NOT re-animate (use a `key`
 * prop at the call site to force a re-mount if you want it to re-play).
 * Respects prefers-reduced-motion and pauses when document is hidden or
 * the element is off-screen.
 */
export function AnimatedNumber({
  value,
  duration = 400,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const elRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    // Skip if document is hidden
    if (typeof document !== 'undefined' && document.hidden) {
      setDisplay(value);
      return;
    }
    // Skip if off-screen (getBoundingClientRect is available in all browsers + jsdom)
    const el = elRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setDisplay(value);
        return;
      }
    }

    startRef.current = null;
    const start = performance.now();

    function step(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutQuart(t);
      const current = eased * value;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
        rafRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only per spec

  return (
    <span ref={elRef} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display.toFixed(decimals)}
    </span>
  );
}
