import type { PaymentMonthlyChartDatum } from '@/components/charts/chart-data';
import { LazyPaymentMonthlyBalanceChart } from '@/components/charts/lazy-payment-monthly-balance-chart';
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
        <LazyPaymentMonthlyBalanceChart data={data} />
      </CardContent>
    </Card>
  );
}
