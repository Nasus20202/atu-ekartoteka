'use client';

import { ChevronDown } from 'lucide-react';

import { CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ChargeDisplayDto } from '@/lib/types/dto/charge-dto';
import { cn, formatCurrency, formatDate, formatPeriod } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

export function YearTrigger({ year, open }: { year: string; open: boolean }) {
  return (
    <CollapsibleTrigger className="flex min-h-11 items-center gap-2 px-1 font-semibold text-muted-foreground transition-colors hover:text-foreground">
      {year}
      <ChevronDown
        className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
      />
    </CollapsibleTrigger>
  );
}

interface MonthTriggerProps {
  period: string;
  total: DecimalLike;
  open: boolean;
  active?: boolean;
}

export function MonthTrigger({
  period,
  total,
  open,
  active = false,
}: MonthTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        'flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-muted',
        active && 'text-primary'
      )}
    >
      <span className={cn('font-medium', active && 'font-semibold')}>
        {formatPeriod(period)}
      </span>
      <span className="flex items-center gap-3">
        <span className="font-semibold tabular-nums">
          {formatCurrency(total)}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </span>
    </CollapsibleTrigger>
  );
}

export function PeriodRange({ charges }: { charges: ChargeDisplayDto[] }) {
  if (charges.length === 0) {
    return null;
  }

  const dateFrom = charges.map((c) => c.dateFrom).sort()[0];
  const dateTo = charges
    .map((c) => c.dateTo)
    .sort()
    .at(-1)!;

  return (
    <span className="text-sm text-muted-foreground">
      Okres {formatDate(new Date(dateFrom))} – {formatDate(new Date(dateTo))}
    </span>
  );
}

function ChargeRow({ charge }: { charge: ChargeDisplayDto }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="break-words font-medium">{charge.description}</p>
        <p className="text-xs text-muted-foreground">
          {toDecimal(charge.quantity).toString()} {charge.unit} ×{' '}
          {formatCurrency(charge.unitPrice)}
        </p>
      </div>
      <p className="shrink-0 font-semibold tabular-nums">
        {formatCurrency(charge.totalAmount)}
      </p>
    </div>
  );
}

export function ChargeRows({ charges }: { charges: ChargeDisplayDto[] }) {
  return (
    <div className="divide-y border-t">
      {charges.map((charge) => (
        <ChargeRow key={charge.id} charge={charge} />
      ))}
    </div>
  );
}
