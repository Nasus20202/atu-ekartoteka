import { ReactNode } from 'react';

import { BackButton } from '@/components/navigation/back-button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-4">
        {showBackButton && <BackButton />}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
