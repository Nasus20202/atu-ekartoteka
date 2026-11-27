'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { AssociationStatsList } from '@/components/import/association-stats-list';
import { AssociationStatsTable } from '@/components/import/association-stats-table';
import { ResponsiveStatsView } from '@/components/import/responsive-stats-view';
import { ASSOCIATION_TABLE_QUERY } from '@/components/import/stats-breakpoints';
import type { AssociationStatsState } from '@/components/import/types';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/shared/utils';

const EMPTY_MESSAGE = 'Brak wspólnot';
const ERROR_MESSAGE = 'Nie udało się pobrać statystyk wspólnot';

interface Props {
  associations: AssociationStatsState;
}

/** Per-association totals, closed by default and requested the first time it opens. */
export function AssociationStatsSection({ associations }: Props) {
  const [open, setOpen] = useState(false);
  const { items, loading, failed } = associations;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) associations.request();
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
        Według wspólnot
        <ChevronDown
          aria-hidden
          className="h-4 w-4 shrink-0 transition-transform duration-200"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4">
          {loading ? (
            <div className="space-y-2" data-testid="associations-skeleton">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : failed ? (
            <p className={cn(REVEAL_CLASS, 'text-sm text-muted-foreground')}>
              {ERROR_MESSAGE}
            </p>
          ) : items ? (
            <div className={REVEAL_CLASS}>
              {items.length > 0 ? (
                <ResponsiveStatsView
                  tableQuery={ASSOCIATION_TABLE_QUERY}
                  table={<AssociationStatsTable associations={items} />}
                  list={<AssociationStatsList associations={items} />}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{EMPTY_MESSAGE}</p>
              )}
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
