'use client';

import {
  ChargeRows,
  MonthTrigger,
  PeriodRange,
  YearTrigger,
} from '@/components/charges/charge-list-parts';
import { useChargeListOpenState } from '@/components/charges/use-charge-list-open-state';
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
import { isPeriodAfterCutoff } from '@/lib/utils/charge-cutoff';
import { getPeriodYear, groupByYearDesc } from '@/lib/utils/group-by-year';
import { sumDecimals } from '@/lib/utils/sum';

interface ChargesDisplayProps {
  periods: string[];
  chargesByPeriod: Record<string, ChargeDisplayDto[]>;
  activeMonth: string | null;
  apartmentLabel: string;
  hoaName: string;
  cutoffPeriod?: string | null;
}

export function ChargesDisplay({
  periods,
  chargesByPeriod,
  activeMonth,
  apartmentLabel,
  hoaName,
  cutoffPeriod,
}: ChargesDisplayProps) {
  const filteredPeriods = periods.filter(
    (p) => !isPeriodAfterCutoff(p, cutoffPeriod)
  );
  const yearGroups = groupByYearDesc(filteredPeriods, getPeriodYear);
  const { openYears, toggleYear, openMonths, toggleMonth } =
    useChargeListOpenState(yearGroups[0]?.year, activeMonth);
  const activeRef = useScrollToActiveMonth(activeMonth);

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
              const isPeriodOpen = openMonths.has(period);

              return (
                <Collapsible
                  key={period}
                  open={isPeriodOpen}
                  onOpenChange={() => toggleMonth(period)}
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
