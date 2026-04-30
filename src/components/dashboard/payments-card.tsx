import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Payment } from '@/lib/types';
import { formatCurrency, MONTH_NAMES_PL } from '@/lib/utils';
import { toDecimal } from '@/lib/utils/decimal';
import { getNonEmptyMonths } from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

interface PaymentsCardProps {
  payment: Payment;
}

export const PaymentsCard = ({ payment }: PaymentsCardProps) => {
  const openingBalance = toDecimal(payment.openingBalance);
  const closingBalance = toDecimal(payment.closingBalance);
  const months = getNonEmptyMonths(payment).map((month) => ({
    name: MONTH_NAMES_PL[month.monthIndex],
    value: month.payments,
  }));

  const totalPayments = sumDecimals(months.map((month) => month.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wpłaty {payment.year}</CardTitle>
        <CardDescription>
          Okres: {payment.dateFrom.toLocaleDateString('pl-PL')} -{' '}
          {payment.dateTo.toLocaleDateString('pl-PL')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Saldo początkowe:</div>
            <div className="text-right">{formatCurrency(openingBalance)}</div>

            <div className="font-medium">Suma wpłat:</div>
            <div className="text-right">{formatCurrency(totalPayments)}</div>

            <div className="border-t pt-2 font-bold">Saldo końcowe:</div>
            <div
              className={`border-t pt-2 text-right font-bold ${closingBalance.isNegative() ? 'text-red-600' : closingBalance.greaterThan(0) ? 'text-green-600' : ''}`}
            >
              {formatCurrency(closingBalance)}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-2 font-semibold text-sm">Wpłaty miesięczne:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {months.map((month) => (
                <div key={month.name} className="flex justify-between">
                  <span className="text-muted-foreground">{month.name}:</span>
                  <span className="font-medium">
                    {formatCurrency(month.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
