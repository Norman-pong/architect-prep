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
 * Counts from the currently displayed number to `value` using rAF + easeOutQuart.
 * Re-animates when `value` changes, so async data that arrives after mount is
 * shown immediately instead of freezing at 0. Respects prefers-reduced-motion
 * and skips animation when the document is hidden or the element is off-screen.
 */
export function AnimatedNumber({
  value,
  duration = 400,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const displayRef = useRef(reduced ? value : 0);
  const rafRef = useRef<number | null>(null);
  const elRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const target = value;
    const from = displayRef.current;

    const finish = () => {
      displayRef.current = target;
      setDisplay(target);
    };

    if (reduced || (typeof document !== 'undefined' && document.hidden)) {
      finish();
      return;
    }
    // Ignore sub-pixel deltas and off-screen elements (no visible animation).
    if (Math.abs(target - from) < 0.5) {
      finish();
      return;
    }
    const el = elRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        finish();
        return;
      }
    }

    const start = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const current = from + (target - from) * easeOutQuart(t);
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        finish();
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration, reduced]);

  return (
    <span ref={elRef} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display.toFixed(decimals)}
    </span>
  );
}
