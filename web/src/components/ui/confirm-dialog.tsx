import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

/**
 * Generic confirm dialog. Backed by @base-ui Dialog primitive (no new
 * dependency). Variant=destructive tints the confirm button red.
 * Used to replace window.confirm() patterns (logout, clear cache, etc).
 *
 * Base UI 1.6 exposes enter/exit animation state via `data-starting-style` /
 * `data-ending-style` (the same contract `ui/dialog` consumes) — `data-state`
 * selectors never matched and left the dialog without its fade.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-dialog bg-foreground/40 backdrop-blur-sm transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <BaseDialog.Popup className="fixed left-1/2 top-1/2 z-dialog grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
          <BaseDialog.Title className="text-base font-semibold text-foreground">
            {title}
          </BaseDialog.Title>
          {description && (
            <BaseDialog.Description className="text-sm text-muted-foreground">
              {description}
            </BaseDialog.Description>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <BaseDialog.Close className="inline-flex min-h-11 items-center rounded-md border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              {cancelLabel}
            </BaseDialog.Close>
            <Button
              className="min-h-11"
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
