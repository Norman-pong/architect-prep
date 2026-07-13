import { cva, type VariantProps } from 'class-variance-authority';
import { Field as BaseField } from '@base-ui/react/field';
import { Input as BaseInput } from '@base-ui/react/input';
import * as React from 'react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      inputSize: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      inputSize: 'md',
    },
  },
);

export type InputProps = Omit<React.ComponentProps<typeof BaseInput>, 'className'> &
  VariantProps<typeof inputVariants> & {
    className?: string;
  };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize, type = 'text', ...props }, ref) => {
    return (
      <BaseInput
        ref={ref}
        type={type}
        className={cn(inputVariants({ inputSize }), className)}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export { inputVariants };

// Field compound components wrapping Base UI Field
export type FieldProps = {
  label?: string;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, error, description, className, children }: FieldProps) {
  return (
    <BaseField.Root className={cn('space-y-2', className)}>
      {label && (
        <BaseField.Label className="text-sm font-medium text-foreground">{label}</BaseField.Label>
      )}
      {children}
      {description && !error && (
        <BaseField.Description className="text-xs text-muted-foreground">
          {description}
        </BaseField.Description>
      )}
      {error && <BaseField.Error className="text-xs text-destructive">{error}</BaseField.Error>}
    </BaseField.Root>
  );
}
