import { ReactNode } from 'react';

import { StickyHeader } from '@/components/layout/sticky-header';
import { BackButton } from '@/components/navigation/back-button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  action,
  className,
}: PageHeaderProps) {
  return (
    <StickyHeader className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 group-data-[stuck=true]/header:flex-nowrap">
        <div className="flex min-w-0 items-center gap-4">
          {showBackButton && <BackButton />}
          <div className="min-w-0">
            <h1 className="text-2xl group-data-[stuck=true]/header:truncate font-bold transition-[font-size] duration-200 group-data-[stuck=true]/header:text-xl sm:text-3xl sm:group-data-[stuck=true]/header:text-xl motion-reduce:transition-none">
              {title}
            </h1>
            {description && (
              <div className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-200 group-data-[stuck=true]/header:grid-rows-[0fr] group-data-[stuck=true]/header:opacity-0 motion-reduce:transition-none">
                <p className="overflow-hidden text-muted-foreground">
                  {description}
                </p>
              </div>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </StickyHeader>
  );
}
