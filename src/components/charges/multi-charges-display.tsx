'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { MultiApartmentPeriodCard } from '@/components/charges/multi-apartment-period-card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SerializableChargeDisplay } from '@/lib/charges/serialize-charge';
import { sumDecimals } from '@/lib/money/sum';
import { formatCurrency, formatPeriod } from '@/lib/utils';

interface ApartmentPeriodData {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: SerializableChargeDisplay[];
}

interface MultiChargesDisplayProps {
  periods: string[];
  chargesByPeriod: Record<string, ApartmentPeriodData[]>;
}

function groupByYear(
  periods: string[]
): Array<{ year: string; periods: string[] }> {
  const yearMap = new Map<string, string[]>();
  for (const period of periods) {
    const year = period.slice(0, 4);
    if (!yearMap.has(year)) yearMap.set(year, []);
    yearMap.get(year)!.push(period);
  }
  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, ps]) => ({ year, periods: ps }));
}

function computePeriodTotal(periodData: ApartmentPeriodData[]) {
  return sumDecimals(
    periodData.flatMap((apartment) =>
      apartment.charges.map((charge) => charge.totalAmount)
    )
  );
}

export function MultiChargesDisplay({
  periods,
  chargesByPeriod,
}: MultiChargesDisplayProps) {
  const yearGroups = groupByYear(periods);
  const mostRecentPeriod = periods[0] ?? null;

  const [openYears, setOpenYears] = useState<Set<string>>(
    () => new Set(yearGroups.map((g) => g.year))
  );

  const [openMonths, setOpenMonths] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (mostRecentPeriod) initial.add(mostRecentPeriod);
    return initial;
  });

  function toggleYear(year: string) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleMonth(period: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {yearGroups.map(({ year, periods: yearPeriods }) => (
        <Collapsible
          key={year}
          open={openYears.has(year)}
          onOpenChange={() => toggleYear(year)}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left font-semibold transition-colors hover:bg-muted">
            {year}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${openYears.has(year) ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {yearPeriods.map((period) => {
              const periodData = chargesByPeriod[period] ?? [];
              const totalPeriodAmount = computePeriodTotal(periodData);
              const isMonthOpen = openMonths.has(period);

              return (
                <Collapsible
                  key={period}
                  open={isMonthOpen}
                  onOpenChange={() => toggleMonth(period)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                    <span className="font-medium">{formatPeriod(period)}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">
                        {formatCurrency(totalPeriodAmount)}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isMonthOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pl-2">
                    <MultiApartmentPeriodCard
                      period={period}
                      apartmentsData={periodData}
                      totalAmount={totalPeriodAmount}
                      hideHeader
                    />
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
