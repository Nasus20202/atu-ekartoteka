'use client';

import { ReactNode } from 'react';

import { useHeaderStuck } from '@/components/layout/use-header-stuck';
import { cn } from '@/lib/utils';

interface StickyHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * The shell keeps the resting height while the bar inside compacts, so the
 * content below does not move when the header morphs.
 */
export function StickyHeader({ children, className }: StickyHeaderProps) {
  const { sentinelRef, contentRef, isStuck, restingHeight } = useHeaderStuck();

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="-mb-px h-px" />
      <div
        data-stuck={isStuck}
        style={{ minHeight: restingHeight }}
        className={cn(
          'group/header pointer-events-none sticky top-[65px] z-40 -mx-2 -mt-2 mb-4',
          className
        )}
      >
        <div
          ref={contentRef}
          className={cn(
            'pointer-events-auto rounded-b-xl border border-transparent px-2 py-2',
            'transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 motion-reduce:transition-none',
            'group-data-[stuck=true]/header:border-border group-data-[stuck=true]/header:bg-background/70 group-data-[stuck=true]/header:shadow-sm group-data-[stuck=true]/header:backdrop-blur-md'
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
