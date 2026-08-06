// web/src/components/ui/toast-viewport.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from '@/stores/toast-store';
import { Toast } from './toast';

/**
 * Mounted once at the root (main.tsx). Positioned: bottom-center on mobile,
 * top-right ≥sm. Renders via createPortal into document.body so it's
 * never trapped by a parent stacking context.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-label="通知"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-toast flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end sm:px-0"
    >
      {toasts.map((t) => (
        <div key={t.id} className="w-full max-w-[min(420px,calc(100vw-32px))]">
          <Toast id={t.id} variant={t.variant} message={t.message} description={t.description} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
