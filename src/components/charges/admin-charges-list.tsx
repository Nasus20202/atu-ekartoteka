'use client';

import {
  ChargeRows,
  MonthTrigger,
  PeriodRange,
  YearTrigger,
} from '@/components/charges/charge-list-parts';
import { useChargeListOpenState } from '@/components/charges/use-charge-list-open-state';
import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import type { ChargePeriodItemDto } from '@/lib/types/dto/charge-dto';
import { getPeriodYear, groupByYearDesc } from '@/lib/utils/group-by-year';
import { sumDecimals } from '@/lib/utils/sum';

type AdminCharge = ChargePeriodItemDto;

interface PeriodSectionProps {
  period: string;
  charges: AdminCharge[];
  apartmentLabel: string;
  hoaName: string;
  open: boolean;
  onToggle: () => void;
}

function PeriodSection({
  period,
  charges,
  apartmentLabel,
  hoaName,
  open,
  onToggle,
}: PeriodSectionProps) {
  const total = sumDecimals(charges.map((charge) => charge.totalAmount));

  return (
    <Collapsible
      open={open}
      onOpenChange={onToggle}
      className="overflow-hidden rounded-lg border bg-card"
    >
      <MonthTrigger period={period} total={total} open={open} />
      <CollapsibleContent className="px-4">
        <div className="flex items-center justify-between gap-2 py-1">
          <PeriodRange charges={charges} />
          <DownloadChargesPdfButton
            apartmentLabel={apartmentLabel}
            hoaName={hoaName}
            period={period}
            charges={charges}
            compact
          />
        </div>
        <ChargeRows charges={charges} />
      </CollapsibleContent>
    </Collapsible>
  );
}

interface AdminChargesListProps {
  charges: AdminCharge[];
  apartmentLabel: string;
  hoaName: string;
}

export function AdminChargesList({
  charges,
  apartmentLabel,
  hoaName,
}: AdminChargesListProps) {
  const byPeriod = charges.reduce(
    (acc, charge) => {
      if (!acc[charge.period]) acc[charge.period] = [];
      acc[charge.period].push(charge);
      return acc;
    },
    {} as Record<string, AdminCharge[]>
  );

  const sortedPeriods = Object.keys(byPeriod).sort((a, b) =>
    b.localeCompare(a)
  );
  const yearGroups = groupByYearDesc(sortedPeriods, getPeriodYear);
  const { openYears, toggleYear, openMonths, toggleMonth } =
    useChargeListOpenState(yearGroups[0]?.year, null);

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
            {yearPeriods.map((period) => (
              <PeriodSection
                key={period}
                period={period}
                charges={byPeriod[period]}
                apartmentLabel={apartmentLabel}
                hoaName={hoaName}
                open={openMonths.has(period)}
                onToggle={() => toggleMonth(period)}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
