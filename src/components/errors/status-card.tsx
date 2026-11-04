import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  titleClassName?: string;
  children: ReactNode;
  actions: ReactNode;
}

/** Centered card for not-found and error pages. */
export function StatusCard({
  icon: Icon,
  iconClassName,
  title,
  titleClassName,
  children,
  actions,
}: Props) {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon
              aria-hidden="true"
              className={cn(
                'mb-4 h-16 w-16 text-muted-foreground',
                iconClassName
              )}
            />
            <h1
              className={cn(
                'mb-2 text-xl font-bold sm:text-2xl',
                titleClassName
              )}
            >
              {title}
            </h1>
            <div className="mb-6 text-center text-muted-foreground">
              {children}
            </div>
            <div className="flex flex-wrap justify-center gap-3">{actions}</div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
