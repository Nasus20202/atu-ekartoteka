'use client';

import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

interface CollapsibleOnMobileProps {
  showLabel: string;
  hideLabel: string;
  children: ReactNode;
}

// The grid row animates between 0fr and 1fr, which needs no measured height.
// Hidden content is made invisible so it leaves the tab order and the
// accessibility tree. Radix is not used: its content keeps an inline
// `transition-duration: 0s` when force-mounted, which disables the transition.
const CONTENT_CLASS_NAME = [
  'grid transition-[grid-template-rows,visibility] duration-200 ease-out',
  'data-[state=open]:grid-rows-[1fr] data-[state=closed]:grid-rows-[0fr]',
  'data-[state=closed]:invisible',
  'lg:data-[state=closed]:grid-rows-[1fr] lg:data-[state=closed]:visible',
].join(' ');

// Collapsed by default below the lg breakpoint; always open from lg up.
export function CollapsibleOnMobile({
  showLabel,
  hideLabel,
  children,
}: CollapsibleOnMobileProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const state = open ? 'open' : 'closed';

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        data-state={state}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 lg:hidden [&[data-state=open]>svg]:rotate-180"
      >
        {open ? hideLabel : showLabel}
        <ChevronDown
          aria-hidden
          className="h-4 w-4 transition-transform duration-200"
        />
      </button>
      <div id={contentId} data-state={state} className={CONTENT_CLASS_NAME}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 pt-4 lg:pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
