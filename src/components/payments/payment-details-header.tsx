import { loadPaymentDetails } from '@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details';
import { PageHeader } from '@/components/layout/page-header';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import type { PaymentDetailsParams } from '@/components/payments/payment-details-params';
import { PaymentYearSelect } from '@/components/payments/payment-year-select';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

export async function PaymentDetailsHeader({ params }: PaymentDetailsParams) {
  const { apartmentId, year } = await params;
  const { apartment, payment, paymentYears } = await loadPaymentDetails(
    apartmentId,
    year
  );

  return (
    <div className={REVEAL_CLASS}>
      <PageHeader
        title={`Wpłaty - ${formatApartmentLabel(apartment)}`}
        description={`Szczegóły wpłat za rok ${payment.year}`}
        action={
          paymentYears.length > 1 && (
            <PaymentYearSelect
              apartmentId={apartment.id}
              year={payment.year}
              years={paymentYears}
            />
          )
        }
      />
    </div>
  );
}
