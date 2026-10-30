import Link from 'next/link';

import { BalanceHistoryChart } from '@/components/charts/balance-history-chart';
import {
  type BalanceHistoryDatum,
  mergeBalanceHistories,
} from '@/components/charts/balance-history-data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

interface ApartmentBalance {
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string | null;
  closingBalance: DecimalLike;
  href: string;
  history: BalanceHistoryDatum[];
}

interface PaymentsSummaryCardProps {
  apartmentBalances: ApartmentBalance[];
}

function getBalanceClass(value: DecimalLike): string {
  return toDecimal(value).greaterThanOrEqualTo(0)
    ? 'text-green-600'
    : 'text-red-600';
}

function ApartmentBalanceSection({ balance }: { balance: ApartmentBalance }) {
  return (
    <Link
      href={balance.href}
      className="flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="font-medium">{balance.apartmentLabel}</p>
        {balance.hoaName && (
          <p className="text-sm text-muted-foreground">{balance.hoaName}</p>
        )}
      </div>
      <span
        className={`shrink-0 text-xl font-bold ${getBalanceClass(balance.closingBalance)}`}
      >
        {formatCurrency(balance.closingBalance)}
      </span>
    </Link>
  );
}

export const PaymentsSummaryCard = ({
  apartmentBalances,
}: PaymentsSummaryCardProps) => {
  if (apartmentBalances.length === 0) return null;

  const balanceTrend = mergeBalanceHistories(
    apartmentBalances.map((balance) => ({
      apartmentId: balance.apartmentId,
      label: balance.apartmentLabel,
      history: balance.history,
    }))
  );
  const grandTotal = sumDecimals(
    apartmentBalances.map((balance) => balance.closingBalance)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo wpłat</CardTitle>
        <CardDescription>Obecny stan rozliczeń</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apartmentBalances.map((balance) => (
            <ApartmentBalanceSection
              key={balance.apartmentId}
              balance={balance}
            />
          ))}

          {apartmentBalances.length > 1 && (
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm text-muted-foreground">Łącznie</span>
              <span
                className={`text-xl font-bold ${getBalanceClass(grandTotal)}`}
              >
                {formatCurrency(grandTotal)}
              </span>
            </div>
          )}

          {balanceTrend.series.length > 0 && (
            <div className="rounded-lg border p-3">
              <BalanceHistoryChart
                data={balanceTrend.data}
                series={balanceTrend.series}
              />
            </div>
          )}

          <Button asChild className="w-full" variant="secondary">
            <Link href="/dashboard/payments">Zobacz wszystkie wpłaty</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
