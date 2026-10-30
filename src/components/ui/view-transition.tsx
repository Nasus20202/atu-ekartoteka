import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ViewTransitionProps {
  view: string;
  className?: string;
  children: ReactNode;
}

/** Animates the content in whenever the selected view changes. */
export function ViewTransition({
  view,
  className,
  children,
}: ViewTransitionProps) {
  return (
    <div
      key={view}
      className={cn(
        'motion-safe:animate-view-switch motion-reduce:animate-none',
        className
      )}
    >
      {children}
    </div>
  );
}
