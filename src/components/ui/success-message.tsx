import { CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function SuccessMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200',
        className
      )}
    >
      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 font-medium">{children}</p>
    </div>
  );
}
