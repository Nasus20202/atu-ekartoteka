'use client';

import { useEffect, useRef, useState } from 'react';

import {
  ChargeRows,
  MonthTrigger,
  PeriodRange,
  YearTrigger,
} from '@/components/charges/charge-list-parts';
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
  const mostRecentPeriod = periods[0] ?? null;

  // All years open by default; if activeMonth given, ensure its year is included
  const [openYears, setOpenYears] = useState<Set<string>>(() => {
    const all = new Set(yearGroups.map((g) => g.year));
    if (activeYear) all.add(activeYear);
    return all;
  });

  // Most recent period open by default; if activeMonth given, open that instead
  const [openPeriods, setOpenPeriods] = useState<Set<string>>(() => {
    if (activeMonth) return new Set([activeMonth]);
    if (mostRecentPeriod) return new Set([mostRecentPeriod]);
    return new Set<string>();
  });

  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeMonth && activeRef.current) {
      const el = activeRef.current;
      // Wait for collapsible animation to finish before scrolling
      const timer = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeMonth]);

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
                      isActive && 'border-primary bg-primary/5'
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
