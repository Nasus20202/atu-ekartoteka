'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { PeriodCard } from '@/components/charges/period-card';
import {
  DownloadChargesPdfButton,
  type SerializableCharge,
} from '@/components/pdf/download-charges-pdf-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ChargeDisplay } from '@/lib/types';
import { formatCurrency, formatPeriod } from '@/lib/utils';

interface YearGroup {
  year: string;
  periods: string[];
}

interface ChargesDisplayProps {
  periods: string[];
  chargesByPeriod: Record<string, ChargeDisplay[]>;
  serializableByPeriod: Record<string, SerializableCharge[]>;
  activeMonth: string | null;
  apartmentLabel: string;
  hoaName: string;
}

function groupByYear(periods: string[]): YearGroup[] {
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

export function ChargesDisplay({
  periods,
  chargesByPeriod,
  serializableByPeriod,
  activeMonth,
  apartmentLabel,
  hoaName,
}: ChargesDisplayProps) {
  const activeYear = activeMonth ? activeMonth.slice(0, 4) : null;
  const yearGroups = groupByYear(periods);
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
              const charges = chargesByPeriod[period] ?? [];
              const totalAmount = charges.reduce(
                (sum, c) => sum + c.totalAmount,
                0
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
                    className={
                      isActive
                        ? 'rounded-lg border-2 border-primary bg-primary/5'
                        : ''
                    }
                  >
                    <CollapsibleTrigger
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
                          : 'bg-card'
                      }`}
                    >
                      <PeriodTriggerLabel
                        period={period}
                        totalAmount={totalAmount}
                        isActive={isActive}
                      />
                      <ChevronDown
                        className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <PeriodCard
                        period={period}
                        charges={charges}
                        totalAmount={totalAmount}
                        action={
                          <DownloadChargesPdfButton
                            apartmentLabel={apartmentLabel}
                            hoaName={hoaName}
                            period={period}
                            charges={serializableByPeriod[period] ?? []}
                          />
                        }
                      />
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

function PeriodTriggerLabel({
  period,
  totalAmount,
  isActive,
}: {
  period: string;
  totalAmount: number;
  isActive: boolean;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className={isActive ? 'font-semibold' : ''}>
        {formatPeriod(period)}
      </span>
      <span
        className={`font-normal ${isActive ? 'text-primary/80' : 'text-muted-foreground'}`}
      >
        {formatCurrency(totalAmount)}
      </span>
    </span>
  );
}
