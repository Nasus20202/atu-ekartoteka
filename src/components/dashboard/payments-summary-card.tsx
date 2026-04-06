import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface HoaPaymentGroup {
  hoaId: string;
  hoaName: string;
  totalClosingBalance: number;
}

interface PaymentsSummaryCardProps {
  hoaGroups: HoaPaymentGroup[];
}

export const PaymentsSummaryCard = ({
  hoaGroups,
}: PaymentsSummaryCardProps) => {
  if (hoaGroups.length === 0) return null;

  const grandTotal = hoaGroups.reduce(
    (sum, g) => sum + g.totalClosingBalance,
    0
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
                  grandTotal >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {grandTotal.toFixed(2)} zł
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
                        group.totalClosingBalance >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {group.totalClosingBalance.toFixed(2)} zł
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm text-muted-foreground">Łącznie</span>
                <span
                  className={`text-xl font-bold ${
                    grandTotal >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {grandTotal.toFixed(2)} zł
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
