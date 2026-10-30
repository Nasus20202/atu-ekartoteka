'use client';

import { useState } from 'react';

import {
  ChargeRows,
  MonthTrigger,
  PeriodRange,
  YearTrigger,
} from '@/components/charges/charge-list-parts';
import {
  ACTIVE_MONTH_CLASS,
  useScrollToActiveMonth,
} from '@/components/charges/use-scroll-to-active-month';
import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  type ChargeDisplayDto,
  toChargePdfItemDto,
} from '@/lib/types/dto/charge-dto';
import { cn } from '@/lib/utils';
import { getPeriodYear, groupByYearDesc } from '@/lib/utils/group-by-year';
import { isPeriodAfterDate } from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

interface ChargesDisplayProps {
  periods: string[];
  chargesByPeriod: Record<string, ChargeDisplayDto[]>;
  activeMonth: string | null;
  apartmentLabel: string;
  hoaName: string;
  chargesDataDate?: string | null;
}

export function ChargesDisplay({
  periods,
  chargesByPeriod,
  activeMonth,
  apartmentLabel,
  hoaName,
  chargesDataDate,
}: ChargesDisplayProps) {
  const filteredPeriods = chargesDataDate
    ? periods.filter((p) => !isPeriodAfterDate(p, chargesDataDate))
    : periods;
  const activeYear = activeMonth ? getPeriodYear(activeMonth) : null;
  const yearGroups = groupByYearDesc(filteredPeriods, getPeriodYear);

  // Only the newest year open by default; if activeMonth given, ensure its year is included
  const [openYears, setOpenYears] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (yearGroups[0]) initial.add(yearGroups[0].year);
    if (activeYear) initial.add(activeYear);
    return initial;
  });

  // Months collapsed by default; if activeMonth given, open that one
  const [openPeriods, setOpenPeriods] = useState<Set<string>>(() => {
    return new Set(activeMonth ? [activeMonth] : []);
  });

  const activeRef = useScrollToActiveMonth(activeMonth);

  function toggleYear(year: string) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function togglePeriod(period: string) {
    setOpenPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {yearGroups.map(({ year, items: yearPeriods }) => (
        <Collapsible
          key={year}
          open={openYears.has(year)}
          onOpenChange={() => toggleYear(year)}
        >
          <YearTrigger year={year} open={openYears.has(year)} />
          <CollapsibleContent className="space-y-2">
            {yearPeriods.map((period) => {
              const charges = chargesByPeriod[period] ?? [];
              const totalAmount = sumDecimals(
                charges.map((charge) => charge.totalAmount)
              );
              const isActive = period === activeMonth;
              const isPeriodOpen = openPeriods.has(period);

              return (
                <Collapsible
                  key={period}
                  open={isPeriodOpen}
                  onOpenChange={() => togglePeriod(period)}
                >
                  <div
                    ref={isActive ? activeRef : null}
                    className={cn(
                      'overflow-hidden rounded-lg border bg-card',
                      isActive && ACTIVE_MONTH_CLASS
                    )}
                  >
                    <MonthTrigger
                      period={period}
                      total={totalAmount}
                      open={isPeriodOpen}
                      active={isActive}
                    />
                    <CollapsibleContent className="px-4">
                      <div className="flex items-center justify-between gap-2 py-1">
                        <PeriodRange charges={charges} />
                        <DownloadChargesPdfButton
                          apartmentLabel={apartmentLabel}
                          hoaName={hoaName}
                          period={period}
                          charges={charges.map(toChargePdfItemDto)}
                          compact
                        />
                      </div>
                      <ChargeRows charges={charges} />
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
