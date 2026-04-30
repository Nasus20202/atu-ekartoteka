'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ChargePeriodItemDto } from '@/lib/types/dto/charge-dto';
import { formatCurrency, formatPeriod } from '@/lib/utils';
import { sumDecimals } from '@/lib/utils/sum';

type AdminCharge = ChargePeriodItemDto;

interface PeriodSectionProps {
  period: string;
  charges: AdminCharge[];
  apartmentLabel: string;
  hoaName: string;
}

function PeriodSection({
  period,
  charges,
  apartmentLabel,
  hoaName,
}: PeriodSectionProps) {
  const [open, setOpen] = useState(false);
  const total = sumDecimals(charges.map((charge) => charge.totalAmount));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border">
        <div className="flex items-center gap-2 p-3">
          <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 text-sm font-medium hover:opacity-80 transition-opacity text-left">
            <span>{formatPeriod(period)}</span>
            <div className="flex items-center gap-3">
              <span className="font-bold">{formatCurrency(total)}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </div>
          </CollapsibleTrigger>
          <DownloadChargesPdfButton
            apartmentLabel={apartmentLabel}
            hoaName={hoaName}
            period={period}
            charges={charges}
          />
        </div>
        <CollapsibleContent>
          <div className="space-y-2 border-t p-3">
            {charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{charge.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {charge.quantity} {charge.unit} ×{' '}
                    {formatCurrency(charge.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {formatCurrency(charge.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
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

  return (
    <div className="space-y-2">
      {sortedPeriods.map((period) => (
        <PeriodSection
          key={period}
          period={period}
          charges={byPeriod[period]}
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
        />
      ))}
    </div>
  );
}
