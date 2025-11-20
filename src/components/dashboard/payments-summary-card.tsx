import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Payment } from '@/lib/types';

interface PaymentsSummaryCardProps {
  payments: Array<
    Payment & {
      apartmentNumber: string;
      apartmentAddress: string;
    }
  >;
}

export const PaymentsSummaryCard = ({ payments }: PaymentsSummaryCardProps) => {
  if (payments.length === 0) {
    return null;
  }

  const totalBalance = payments.reduce((sum, p) => sum + p.closingBalance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo wpłat</CardTitle>
        <CardDescription>Obecny stan rozliczeń</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground">
              Łączne saldo wszystkich lokali
            </div>
            <div
              className={`text-3xl font-bold ${
                totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalBalance.toFixed(2)} zł
            </div>
          </div>

          <Button asChild className="w-full" variant="secondary">
            <Link href="/dashboard/payments">Zobacz wszystkie wpłaty</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
