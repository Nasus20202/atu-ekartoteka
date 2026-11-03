import { loadPaymentDetails } from '@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { PaymentApartmentDetailsCard } from '@/components/payments/payment-apartment-details-card';
import type { PaymentDetailsParams } from '@/components/payments/payment-details-params';

export async function PaymentApartmentSection({
  params,
}: PaymentDetailsParams) {
  const { apartmentId, year } = await params;
  const { apartment } = await loadPaymentDetails(apartmentId, year);

  return (
    <div className={REVEAL_CLASS}>
      <PaymentApartmentDetailsCard
        address={apartment.address ?? ''}
        building={apartment.building}
        number={apartment.number}
        postalCode={apartment.postalCode ?? ''}
        city={apartment.city ?? ''}
        shareRatio={apartment.shareRatio}
      />
    </div>
  );
}
