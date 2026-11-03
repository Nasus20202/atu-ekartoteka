import { loadPaymentDetails } from '@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import type { PaymentDetailsParams } from '@/components/payments/payment-details-params';
import { PaymentTable } from '@/components/payments/payment-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export async function PaymentTableSection({ params }: PaymentDetailsParams) {
  const { apartmentId, year } = await params;
  const { apartment, payment, cutoffPeriod } = await loadPaymentDetails(
    apartmentId,
    year
  );

  return (
    <Card className={REVEAL_CLASS}>
      <CardHeader>
        <CardTitle>Wpłaty i naliczenia miesięczne</CardTitle>
        <CardDescription>
          Szczegółowy wykaz wpłat i naliczeń z bilansem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PaymentTable
          payment={payment}
          apartmentId={apartment.id}
          cutoffPeriod={cutoffPeriod}
        />
      </CardContent>
    </Card>
  );
}
