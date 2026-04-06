import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Payment } from '@/lib/types';
import { MONTH_NAMES_PL } from '@/lib/utils';

interface PaymentsCardProps {
  payment: Payment;
}

export const PaymentsCard = ({ payment }: PaymentsCardProps) => {
  const months = [
    { name: MONTH_NAMES_PL[0], value: payment.januaryPayments },
    { name: MONTH_NAMES_PL[1], value: payment.februaryPayments },
    { name: MONTH_NAMES_PL[2], value: payment.marchPayments },
    { name: MONTH_NAMES_PL[3], value: payment.aprilPayments },
    { name: MONTH_NAMES_PL[4], value: payment.mayPayments },
    { name: MONTH_NAMES_PL[5], value: payment.junePayments },
    { name: MONTH_NAMES_PL[6], value: payment.julyPayments },
    { name: MONTH_NAMES_PL[7], value: payment.augustPayments },
    { name: MONTH_NAMES_PL[8], value: payment.septemberPayments },
    { name: MONTH_NAMES_PL[9], value: payment.octoberPayments },
    { name: MONTH_NAMES_PL[10], value: payment.novemberPayments },
    { name: MONTH_NAMES_PL[11], value: payment.decemberPayments },
  ];

  const totalPayments = months.reduce((sum, month) => sum + month.value, 0);

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
            <div className="text-right">
              {payment.openingBalance.toFixed(2)} zł
            </div>

            <div className="font-medium">Suma wpłat:</div>
            <div className="text-right">{totalPayments.toFixed(2)} zł</div>

            <div className="border-t pt-2 font-bold">Saldo końcowe:</div>
            <div
              className={`border-t pt-2 text-right font-bold ${payment.closingBalance < 0 ? 'text-green-600' : payment.closingBalance > 0 ? 'text-red-600' : ''}`}
            >
              {payment.closingBalance.toFixed(2)} zł
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-2 font-semibold text-sm">Wpłaty miesięczne:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {months.map((month) => (
                <div key={month.name} className="flex justify-between">
                  <span className="text-muted-foreground">{month.name}:</span>
                  <span className="font-medium">
                    {month.value.toFixed(2)} zł
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
