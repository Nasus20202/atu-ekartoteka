import Link from 'next/link';

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

interface HoaPaymentGroup {
  hoaId: string;
  hoaName: string;
  totalClosingBalance: DecimalLike;
}

interface PaymentsSummaryCardProps {
  hoaGroups: HoaPaymentGroup[];
}

export const PaymentsSummaryCard = ({
  hoaGroups,
}: PaymentsSummaryCardProps) => {
  if (hoaGroups.length === 0) return null;

  const grandTotal = sumDecimals(
    hoaGroups.map((group) => group.totalClosingBalance)
  );

  const isSingle = hoaGroups.length === 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo wpłat</CardTitle>
        <CardDescription>Obecny stan rozliczeń</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isSingle ? (
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm text-muted-foreground">
                {hoaGroups[0].hoaName}
              </span>
              <span
                className={`text-2xl font-bold ${
                  grandTotal.greaterThanOrEqualTo(0)
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(grandTotal)}
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {hoaGroups.map((group) => (
                  <div
                    key={group.hoaId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{group.hoaName}</span>
                    <span
                      className={`font-semibold ${
                        toDecimal(
                          group.totalClosingBalance
                        ).greaterThanOrEqualTo(0)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(group.totalClosingBalance)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm text-muted-foreground">Łącznie</span>
                <span
                  className={`text-xl font-bold ${
                    grandTotal.greaterThanOrEqualTo(0)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </>
          )}

          <Button asChild className="w-full" variant="secondary">
            <Link href="/dashboard/payments">Zobacz wszystkie wpłaty</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
