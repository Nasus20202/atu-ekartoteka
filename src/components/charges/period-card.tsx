import { Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SerializableChargeDisplay } from '@/lib/charges/serialize-charge';
import { type DecimalLike, toDecimal } from '@/lib/money/decimal';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils';

type ChargeItemProps = {
  charge: SerializableChargeDisplay;
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

type PeriodCardProps = {
  period: string;
  charges: SerializableChargeDisplay[];
  totalAmount: DecimalLike;
  action?: React.ReactNode;
};

export function PeriodCard({
  period,
  charges,
  totalAmount,
  action,
}: PeriodCardProps) {
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
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Razem</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            {action}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {charges.map((charge) => (
            <ChargeItem key={charge.id} charge={charge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
