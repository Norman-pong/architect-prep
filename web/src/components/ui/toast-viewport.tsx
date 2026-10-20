// web/src/components/ui/toast-viewport.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toast-store';
import { Toast } from './toast';

/**
 * Mounted once at the root (main.tsx). Positioned: bottom-center on mobile
 * (lifted above the reader's sticky action bar + safe-area), top-right ≥sm.
 * Renders via createPortal into document.body so it's never trapped by a
 * parent stacking context.
 */
export function ToastViewport() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const latestToastId = toasts[toasts.length - 1]?.id;

  // Escape dismisses the newest toast (spec §2.1.2); the listener only exists
  // while at least one toast is visible.
  useEffect(() => {
    if (!latestToastId) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      useToastStore.getState().remove(latestToastId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [latestToastId]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="region"
      aria-label={t('a11y.notifications')}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem_+_env(safe-area-inset-bottom)_+_68px)] z-toast flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end sm:px-0"
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
