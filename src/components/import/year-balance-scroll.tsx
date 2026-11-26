'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { useYearBalanceScroll } from '@/components/import/use-year-balance-scroll';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

export function YearBalanceScroll({ children }: Props) {
  const { ref, atStart, atEnd, onScroll, scrollByYear } =
    useYearBalanceScroll();

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atStart}
          onClick={() => scrollByYear('previous')}
          aria-label="Poprzedni rok"
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Wcześniejszy rok
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atEnd}
          onClick={() => scrollByYear('next')}
          aria-label="Następny rok"
        >
          Późniejszy rok
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div
        ref={ref}
        onScroll={onScroll}
        data-scrolled={!atStart}
        className="group/scroll overflow-x-auto rounded-lg border"
      >
        {children}
      </div>
    </div>
  );
}
