import type { PaymentMonthlyChartDatum } from '@/components/charts/chart-data';
import { PaymentMonthlyBalanceChart } from '@/components/charts/payment-monthly-balance-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PaymentMonthlyChartCardProps {
  data: PaymentMonthlyChartDatum[];
}

export function PaymentMonthlyChartCard({
  data,
}: PaymentMonthlyChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wykres rozliczeń miesięcznych</CardTitle>
        <CardDescription>
          Porównanie wpłat, naliczeń i salda w kolejnych miesiącach.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PaymentMonthlyBalanceChart data={data} />
      </CardContent>
    </Card>
  );
}
