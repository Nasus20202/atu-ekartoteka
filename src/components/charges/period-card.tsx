import { Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChargeDisplay } from '@/lib/types';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils';

type ChargeItemProps = {
  charge: ChargeDisplay;
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

type PeriodCardProps = {
  period: string;
  charges: ChargeDisplay[];
  totalAmount: number;
};

export function PeriodCard({ period, charges, totalAmount }: PeriodCardProps) {
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
