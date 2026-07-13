import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
  {
    variants: {
      invalid: {
        true: 'border-destructive focus-visible:ring-destructive',
        false: '',
      },
      inputSize: {
        sm: 'h-8 text-xs',
        md: 'h-10',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      invalid: false,
      inputSize: 'md',
    },
  },
);

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, inputSize, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(inputVariants({ invalid, inputSize }), className)}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: React.ReactNode;
  error?: React.ReactNode;
  description?: React.ReactNode;
  wrapperClassName?: string;
};

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, description, id, className, wrapperClassName, required, ...props }, ref) => {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const errorId = error ? `${fieldId}-error` : undefined;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <Input
          ref={ref}
          id={fieldId}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
          className={className}
          {...props}
        />
        {description && !error && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Field.displayName = 'Field';

export { inputVariants };
