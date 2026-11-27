'use client';

import { CalendarDays } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TimeField } from '@/components/ui/time-field';
import { cn } from '@/lib/shared/utils';
import { formatLongDay } from '@/lib/shared/utils/calendar';
import {
  joinDateTime,
  MAX_HOURS,
  MAX_MINUTES,
  splitDateTime,
} from '@/lib/shared/utils/date-time';

interface DateTimePickerProps {
  id?: string;
  /** "YYYY-MM-DDTHH:mm" in local time, or an empty string */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** A day from a calendar and a time of that day. */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Wybierz datę i godzinę',
  disabled,
  ...props
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const valueId = useId();
  const parts = splitDateTime(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          {...props}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-describedby={valueId}
          className={cn(
            'w-full justify-start font-normal tabular-nums',
            !parts && 'text-muted-foreground'
          )}
        >
          <CalendarDays aria-hidden />
          <span id={valueId} className="truncate">
            {parts ? `${formatLongDay(parts.day)}, ${parts.time}` : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto space-y-3 p-3">
        <Calendar
          selected={parts?.day ?? null}
          onSelect={(day) =>
            onChange(joinDateTime(day, parts?.hours, parts?.minutes))
          }
        />
        <div className="flex items-center justify-center gap-2 border-t pt-3">
          <span className="text-sm text-muted-foreground">Godzina</span>
          <TimeField
            label="Godziny"
            max={MAX_HOURS}
            disabled={!parts}
            value={parts?.hours ?? null}
            onChange={(hours) => {
              if (parts) {
                onChange(joinDateTime(parts.day, hours, parts.minutes));
              }
            }}
          />
          <span aria-hidden>:</span>
          <TimeField
            label="Minuty"
            max={MAX_MINUTES}
            disabled={!parts}
            value={parts?.minutes ?? null}
            onChange={(minutes) => {
              if (parts) {
                onChange(joinDateTime(parts.day, parts.hours, minutes));
              }
            }}
          />
        </div>
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!parts}
            onClick={() => onChange('')}
          >
            Wyczyść
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Gotowe
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
