// web/src/hooks/use-reduced-motion.ts
import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion: reduce`. Returns `true` when the user
 * has requested reduced motion in their OS or browser. CSS keyframes are
 * collapsed to static in `styles/index.css` regardless — this hook is only
 * consulted by JS-driven (rAF) animations like <AnimatedNumber />.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    function onChange(e: MediaQueryListEvent) {
      setReduced(e.matches);
    }
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
