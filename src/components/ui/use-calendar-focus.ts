import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { addDays, addMonths } from '@/lib/shared/utils/calendar';

const MOVES: Record<string, (day: string) => string> = {
  ArrowLeft: (day) => addDays(day, -1),
  ArrowRight: (day) => addDays(day, 1),
  ArrowUp: (day) => addDays(day, -7),
  ArrowDown: (day) => addDays(day, 7),
  PageUp: (day) => addMonths(day, -1),
  PageDown: (day) => addMonths(day, 1),
};

/** The day the keyboard is on; the shown month is the month of that day. */
export function useCalendarFocus(initial: string) {
  const [focused, setFocused] = useState(initial);
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  // After a key the new day takes the focus, also in a newly drawn month
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-day="${focused}"]`)
      ?.focus();
  }, [focused]);

  const onKeyDown = (event: KeyboardEvent) => {
    const move = MOVES[event.key];
    if (!move) return;
    event.preventDefault();
    moveFocus.current = true;
    setFocused(move);
  };

  const showMonth = (offset: number) =>
    setFocused((day) => addMonths(day, offset));

  return { focused, showMonth, gridRef, onKeyDown } as const;
}
