import type { ReactNode } from 'react';

import {
  TURNSTILE_HEIGHT,
  type TurnstileFit,
} from '@/components/auth/use-turnstile-fit';

interface Props {
  slotRef: (node: HTMLDivElement | null) => void;
  fit: TurnstileFit;
  children: ReactNode;
}

/**
 * Reserves the widget's height and matches its width to the form controls.
 * Turnstile never renders narrower than its minimum width, so on narrow
 * screens the widget is scaled down from its top left corner.
 */
export function TurnstileFitSlot({ slotRef, fit, children }: Props) {
  return (
    <div ref={slotRef} className="w-full" style={{ height: fit.height }}>
      <div
        className="origin-top-left"
        style={{
          width: fit.width,
          height: TURNSTILE_HEIGHT,
          transform: `scale(${fit.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
