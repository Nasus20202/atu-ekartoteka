'use client';

import {
  MonthTrigger,
  YearTrigger,
} from '@/components/charges/charge-list-parts';
import { MultiApartmentPeriodCard } from '@/components/charges/multi-apartment-period-card';
import { useChargeListOpenState } from '@/components/charges/use-charge-list-open-state';
import {
  ACTIVE_MONTH_CLASS,
  useScrollToActiveMonth,
} from '@/components/charges/use-scroll-to-active-month';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import type { ChargeDisplayDto } from '@/lib/types/dto/charge-dto';
import { cn } from '@/lib/utils';
import { getPeriodYear, groupByYearDesc } from '@/lib/utils/group-by-year';
import { isPeriodAfterDate } from '@/lib/utils/period';
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
  activeMonth?: string | null;
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
  activeMonth = null,
}: MultiChargesDisplayProps) {
  const filteredPeriods = chargesDataDate
    ? periods.filter((p) => !isPeriodAfterDate(p, chargesDataDate))
    : periods;
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
              const periodData = chargesByPeriod[period] ?? [];
              const totalPeriodAmount = computePeriodTotal(periodData);
              const isMonthOpen = openMonths.has(period);
              const isActive = period === activeMonth;

              return (
                <Collapsible
                  key={period}
                  ref={isActive ? activeRef : undefined}
                  open={isMonthOpen}
                  onOpenChange={() => toggleMonth(period)}
                  className={cn(
                    'overflow-hidden rounded-lg border bg-card',
                    isActive && ACTIVE_MONTH_CLASS
                  )}
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
