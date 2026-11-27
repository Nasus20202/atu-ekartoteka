'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCalendarFocus } from '@/components/ui/use-calendar-focus';
import { ViewTransition } from '@/components/ui/view-transition';
import { cn } from '@/lib/shared/utils';
import {
  formatLongDay,
  formatMonth,
  monthWeeks,
  WEEKDAYS,
} from '@/lib/shared/utils/calendar';
import { toLocalIsoDate } from '@/lib/shared/utils/local-date';

interface CalendarProps {
  /** The chosen day as "YYYY-MM-DD", or null */
  selected: string | null;
  onSelect: (day: string) => void;
}

/** One month of days, Monday first, in Polish. */
export function Calendar({ selected, onSelect }: CalendarProps) {
  const today = toLocalIsoDate(new Date());
  const { focused, showMonth, gridRef, onKeyDown } = useCalendarFocus(
    selected ?? today
  );
  const month = focused.slice(0, 7);

  return (
    <div className="w-fit space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Poprzedni miesiąc"
          onClick={() => showMonth(-1)}
        >
          <ChevronLeft />
        </Button>
        <p className="text-sm font-semibold capitalize" aria-live="polite">
          {formatMonth(focused)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Następny miesiąc"
          onClick={() => showMonth(1)}
        >
          <ChevronRight />
        </Button>
      </div>
      <ViewTransition view={month}>
        <div ref={gridRef} onKeyDown={onKeyDown}>
          <table role="grid" aria-label={formatMonth(focused)}>
            <thead>
              <tr>
                {WEEKDAYS.map(({ short, long }) => (
                  <th
                    key={short}
                    abbr={long}
                    className="h-8 w-9 text-center text-xs font-normal text-muted-foreground"
                  >
                    {short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks(focused).map((week) => (
                <tr key={week[0]}>
                  {week.map((day) => (
                    <td
                      key={day}
                      aria-selected={day === selected}
                      className="p-0 text-center"
                    >
                      <button
                        type="button"
                        data-day={day}
                        tabIndex={day === focused ? 0 : -1}
                        aria-label={formatLongDay(day)}
                        aria-pressed={day === selected}
                        aria-current={day === today ? 'date' : undefined}
                        className={cn(
                          'h-9 w-9 rounded-md text-sm tabular-nums transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          !day.startsWith(month) &&
                            'text-muted-foreground opacity-50',
                          day === today && 'border border-primary',
                          day === selected &&
                            'bg-primary text-primary-foreground hover:bg-primary/90'
                        )}
                        onClick={() => onSelect(day)}
                      >
                        {Number(day.slice(8))}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ViewTransition>
    </div>
  );
}
