'use client';

import { useState } from 'react';

import {
  MonthTrigger,
  YearTrigger,
} from '@/components/charges/charge-list-parts';
import { MultiApartmentPeriodCard } from '@/components/charges/multi-apartment-period-card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import type { ChargeDisplayDto } from '@/lib/types/dto/charge-dto';
import { isPeriodAfterDate } from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

interface ApartmentPeriodData {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplayDto[];
}

interface MultiChargesDisplayProps {
  periods: string[];
  chargesByPeriod: Record<string, ApartmentPeriodData[]>;
  chargesDataDate?: string | null;
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
  chargesDataDate,
}: MultiChargesDisplayProps) {
  const filteredPeriods = chargesDataDate
    ? periods.filter((p) => !isPeriodAfterDate(p, chargesDataDate))
    : periods;
  const yearGroups = groupByYear(filteredPeriods);
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
    <div className="space-y-2">
      {yearGroups.map(({ year, periods: yearPeriods }) => (
        <Collapsible
          key={year}
          open={openYears.has(year)}
          onOpenChange={() => toggleYear(year)}
        >
          <YearTrigger year={year} open={openYears.has(year)} />
          <CollapsibleContent className="space-y-2">
            {yearPeriods.map((period) => {
              const periodData = chargesByPeriod[period] ?? [];
              const totalPeriodAmount = computePeriodTotal(periodData);
              const isMonthOpen = openMonths.has(period);

              return (
                <Collapsible
                  key={period}
                  open={isMonthOpen}
                  onOpenChange={() => toggleMonth(period)}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <MonthTrigger
                    period={period}
                    total={totalPeriodAmount}
                    open={isMonthOpen}
                  />
                  <CollapsibleContent>
                    <MultiApartmentPeriodCard
                      period={period}
                      apartmentsData={periodData}
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
