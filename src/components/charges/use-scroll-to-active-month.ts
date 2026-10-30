import { useEffect, useRef } from 'react';

// Wait for the collapsible animation to finish before scrolling
export const ACTIVE_MONTH_SCROLL_DELAY_MS = 300;
// scroll-mt keeps the month below the sticky navbar
export const ACTIVE_MONTH_CLASS = 'scroll-mt-20 border-primary bg-primary/5';

export function useScrollToActiveMonth(activeMonth: string | null) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = activeRef.current;
    if (!activeMonth || !el) return;

    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, ACTIVE_MONTH_SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activeMonth]);

  return activeRef;
}
