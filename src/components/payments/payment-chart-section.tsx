import { loadPaymentDetails } from '@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details';
import { getPaymentMonthlyChartData } from '@/components/charts/chart-data';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import type { PaymentDetailsParams } from '@/components/payments/payment-details-params';
import { PaymentMonthlyChartCard } from '@/components/payments/payment-monthly-chart-card';

export async function PaymentChartSection({ params }: PaymentDetailsParams) {
  const { apartmentId, year } = await params;
  const { payment } = await loadPaymentDetails(apartmentId, year);

  return (
    <div className={REVEAL_CLASS}>
      <PaymentMonthlyChartCard data={getPaymentMonthlyChartData(payment)} />
    </div>
  );
}
