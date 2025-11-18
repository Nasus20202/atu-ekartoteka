import { Building2, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChargeData,
  formatCurrency,
  formatDate,
  formatPeriod,
} from '@/lib/charge-utils';

type ApartmentChargesData = {
  apartmentNumber: string;
  apartmentAddress: string;
  charges: ChargeData[];
};

type ChargeItemProps = {
  charge: ChargeData;
};

function ChargeItem({ charge }: ChargeItemProps) {
  return (
    <div className="flex items-center justify-between rounded bg-muted/50 p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium">{charge.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(charge.dateFrom)} - {formatDate(charge.dateTo)}
        </p>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-muted-foreground">
            {charge.quantity} {charge.unit}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(charge.unitPrice)} / {charge.unit}
          </p>
        </div>
        <p className="w-24 font-bold">{formatCurrency(charge.totalAmount)}</p>
      </div>
    </div>
  );
}

type ApartmentSectionProps = {
  apartmentData: ApartmentChargesData;
};

function ApartmentSection({ apartmentData }: ApartmentSectionProps) {
  const apartmentTotal = apartmentData.charges.reduce(
    (sum, charge) => sum + charge.totalAmount,
    0
  );

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{apartmentData.apartmentAddress}</h3>
        </div>
        <p className="text-lg font-bold">{formatCurrency(apartmentTotal)}</p>
      </div>

      <div className="space-y-2">
        {apartmentData.charges.map((charge) => (
          <ChargeItem key={charge.id} charge={charge} />
        ))}
      </div>
    </div>
  );
}

type MultiApartmentPeriodCardProps = {
  period: string;
  apartmentsData: ApartmentChargesData[];
  totalAmount: number;
};

export function MultiApartmentPeriodCard({
  period,
  apartmentsData,
  totalAmount,
}: MultiApartmentPeriodCardProps) {
  return (
    <Card>
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
      <CardContent className="space-y-6">
        {apartmentsData.map((apartmentData) => (
          <ApartmentSection
            key={apartmentData.apartmentNumber}
            apartmentData={apartmentData}
          />
        ))}
      </CardContent>
    </Card>
  );
}
