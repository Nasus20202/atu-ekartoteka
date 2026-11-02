import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 data-[state=open]:motion-safe:animate-slide-in-top data-[state=closed]:motion-safe:animate-slide-out-top motion-reduce:animate-none',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        destructive:
          'border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive dark:bg-red-950/30 dark:text-red-400 [&>svg]:text-destructive dark:[&>svg]:text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type AlertVariants<P> = P & VariantProps<typeof alertVariants>;

type AlertProps = AlertVariants<React.HTMLAttributes<HTMLDivElement>> & {
  'data-state'?: 'open' | 'closed';
};

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-state="open"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
