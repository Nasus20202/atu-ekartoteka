'use client';

import { Building2, Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  type ChargeDisplayDto,
  toChargePdfItemDto,
} from '@/lib/types/dto/charge-dto';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

type ApartmentChargesData = {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplayDto[];
};

type ChargeItemProps = {
  charge: ChargeDisplayDto;
};

function ChargeItem({ charge }: ChargeItemProps) {
  const quantityLabel = toDecimal(charge.quantity).toString();

  return (
    <div className="flex flex-col gap-2 rounded bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <p className="font-medium">{charge.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(new Date(charge.dateFrom))} -{' '}
          {formatDate(new Date(charge.dateTo))}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-4 text-right">
        <div>
          <p className="text-muted-foreground">
            {quantityLabel} {charge.unit}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(charge.unitPrice)} / {charge.unit}
          </p>
        </div>
        <p className="whitespace-nowrap font-bold">
          {formatCurrency(charge.totalAmount)}
        </p>
      </div>
    </div>
  );
}

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
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center gap-2 p-4">
          <CollapsibleTrigger className="flex flex-1 min-w-0 items-center justify-between gap-2 hover:opacity-80 transition-opacity text-left">
            <div className="flex min-w-0 items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h3 className="truncate font-semibold">
                {apartmentData.apartmentAddress}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <p className="text-lg font-bold">
                {formatCurrency(apartmentTotal)}
              </p>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </div>
          </CollapsibleTrigger>
          <div className="shrink-0">
            <DownloadChargesPdfButton
              apartmentLabel={apartmentData.apartmentAddress}
              hoaName={apartmentData.hoaName}
              period={period}
              charges={apartmentData.charges.map(toChargePdfItemDto)}
            />
          </div>
        </div>
        <CollapsibleContent>
          <div className="space-y-2 border-t p-4">
            {apartmentData.charges.map((charge) => (
              <ChargeItem key={charge.id} charge={charge} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

type MultiApartmentPeriodCardProps = {
  period: string;
  apartmentsData: ApartmentChargesData[];
  totalAmount: DecimalLike;
  hideHeader?: boolean;
};

export function MultiApartmentPeriodCard({
  period,
  apartmentsData,
  totalAmount,
  hideHeader = false,
}: MultiApartmentPeriodCardProps) {
  return (
    <Card>
      {!hideHeader && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatPeriod(period)}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Okres rozliczeniowy
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Razem</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={hideHeader ? 'pt-6 space-y-4' : 'space-y-4'}>
        {apartmentsData.map((apartmentData) => (
          <ApartmentSection
            key={`${apartmentData.apartmentAddress}-${apartmentData.apartmentNumber}`}
            apartmentData={apartmentData}
            period={period}
          />
        ))}
      </CardContent>
    </Card>
  );
}
