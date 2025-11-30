import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Payment } from '@/lib/types';

interface PaymentsCardProps {
  payment: Payment;
}

export const PaymentsCard = ({ payment }: PaymentsCardProps) => {
  const months = [
    { name: 'Styczeń', value: payment.januaryPayments },
    { name: 'Luty', value: payment.februaryPayments },
    { name: 'Marzec', value: payment.marchPayments },
    { name: 'Kwiecień', value: payment.aprilPayments },
    { name: 'Maj', value: payment.mayPayments },
    { name: 'Czerwiec', value: payment.junePayments },
    { name: 'Lipiec', value: payment.julyPayments },
    { name: 'Sierpień', value: payment.augustPayments },
    { name: 'Wrzesień', value: payment.septemberPayments },
    { name: 'Październik', value: payment.octoberPayments },
    { name: 'Listopad', value: payment.novemberPayments },
    { name: 'Grudzień', value: payment.decemberPayments },
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
