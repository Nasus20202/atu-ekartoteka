'use client';

import { Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  ChargeRows,
  PeriodRange,
} from '@/components/charges/charge-list-parts';
import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MarqueeText } from '@/components/ui/marquee-text';
import {
  type ChargeDisplayDto,
  toChargePdfItemDto,
} from '@/lib/types/dto/charge-dto';
import { cn, formatCurrency } from '@/lib/utils';
import { sumDecimals } from '@/lib/utils/sum';

type ApartmentChargesData = {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplayDto[];
};

type ApartmentSectionProps = {
  apartmentData: ApartmentChargesData;
  period: string;
};

function ApartmentSection({ apartmentData, period }: ApartmentSectionProps) {
  const [open, setOpen] = useState(true);
  const apartmentTotal = sumDecimals(
    apartmentData.charges.map((charge) => charge.totalAmount)
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h3 className="min-w-0 flex-1 font-medium">
            <MarqueeText>{apartmentData.apartmentAddress}</MarqueeText>
          </h3>
          <span className="shrink-0 font-semibold tabular-nums">
            {formatCurrency(apartmentTotal)}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <DownloadChargesPdfButton
          apartmentLabel={apartmentData.apartmentAddress}
          hoaName={apartmentData.hoaName}
          period={period}
          charges={apartmentData.charges.map(toChargePdfItemDto)}
          compact
        />
      </div>
      <CollapsibleContent>
        <ChargeRows charges={apartmentData.charges} />
      </CollapsibleContent>
    </Collapsible>
  );
}

type MultiApartmentPeriodCardProps = {
  period: string;
  apartmentsData: ApartmentChargesData[];
};

export function MultiApartmentPeriodCard({
  period,
  apartmentsData,
}: MultiApartmentPeriodCardProps) {
  return (
    <div className="px-4">
      <div className="py-2">
        <PeriodRange charges={apartmentsData.flatMap((a) => a.charges)} />
      </div>
      {apartmentsData.map((apartmentData) => (
        <ApartmentSection
          key={`${apartmentData.apartmentAddress}-${apartmentData.apartmentNumber}`}
          apartmentData={apartmentData}
          period={period}
        />
      ))}
    </div>
  );
}
