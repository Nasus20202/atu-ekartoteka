'use client';

import type { ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePresence } from '@/hooks/use-presence';
import { useRetainedValue } from '@/hooks/use-retained-value';

interface AnimatedAlertProps {
  show: boolean;
  children: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

/**
 * Alert that animates in when shown and out before it unmounts. The message is
 * retained during the exit so it does not disappear while fading.
 */
export function AnimatedAlert({
  show,
  children,
  variant,
  className,
}: AnimatedAlertProps) {
  const { isMounted, state } = usePresence(show);
  const message = useRetainedValue(show ? children : null);

  if (!isMounted) {
    return null;
  }

  return (
    <Alert variant={variant} data-state={state} className={className}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
