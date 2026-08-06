import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

export const Dialog = BaseDialog.Root;

export type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Trigger> & {
  className?: string;
};

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Trigger ref={ref} className={className} {...props} />
  ),
);
DialogTrigger.displayName = 'DialogTrigger';

export type DialogPortalProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Portal>;

export const DialogPortal = (props: DialogPortalProps) => <BaseDialog.Portal {...props} />;
DialogPortal.displayName = 'DialogPortal';

export type DialogBackdropProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop> & {
  className?: string;
};

export const DialogBackdrop = React.forwardRef<HTMLDivElement, DialogBackdropProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Backdrop
      ref={ref}
      className={cn(
        'fixed inset-0 z-dialog bg-foreground/40 backdrop-blur-sm',
        'transition-opacity data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        className,
      )}
      {...props}
    />
  ),
);
DialogBackdrop.displayName = 'DialogBackdrop';

export type DialogPopupProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> & {
  className?: string;
};

export const DialogPopup = React.forwardRef<HTMLDivElement, DialogPopupProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Popup
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-dialog grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg',
        'transition-all data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2',
        className,
      )}
      {...props}
    />
  ),
);
DialogPopup.displayName = 'DialogPopup';

export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Title> & {
  className?: string;
};

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = 'DialogTitle';

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof BaseDialog.Description
> & {
  className?: string;
};

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
);
DialogDescription.displayName = 'DialogDescription';

export type DialogCloseProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Close> & {
  className?: string;
};

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, ...props }, ref) => <BaseDialog.Close ref={ref} className={className} {...props} />,
);
DialogClose.displayName = 'DialogClose';
