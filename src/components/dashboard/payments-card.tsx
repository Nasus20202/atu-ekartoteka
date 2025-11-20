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
    { name: 'Styczeń', value: payment.january },
    { name: 'Luty', value: payment.february },
    { name: 'Marzec', value: payment.march },
    { name: 'Kwiecień', value: payment.april },
    { name: 'Maj', value: payment.may },
    { name: 'Czerwiec', value: payment.june },
    { name: 'Lipiec', value: payment.july },
    { name: 'Sierpień', value: payment.august },
    { name: 'Wrzesień', value: payment.september },
    { name: 'Październik', value: payment.october },
    { name: 'Listopad', value: payment.november },
    { name: 'Grudzień', value: payment.december },
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

            <div className="font-medium">Naliczenie:</div>
            <div className="text-right">
              {payment.totalCharges.toFixed(2)} zł
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
