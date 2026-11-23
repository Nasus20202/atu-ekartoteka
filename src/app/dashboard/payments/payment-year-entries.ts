import { toPaymentListItemDto } from '@/lib/payments/dto/payment-dto';
import { formatDate } from '@/lib/shared/utils';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import type { findUserWithApartmentPayments } from '@/lib/users/queries/find-user-with-apartment-payments';

type PaymentsUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartmentPayments>>
>;
type PaymentsApartment = PaymentsUser['apartments'][number];

export function toPaymentYearEntries(apartment: PaymentsApartment) {
  const apartmentLabel = formatApartmentLabel(apartment);

  return apartment.payments.map((payment) => ({
    payment: toPaymentListItemDto(payment),
    apartmentId: apartment.id,
    apartmentLabel,
    hoaName: apartment.homeownersAssociation.name,
    dateFromLabel: formatDate(payment.dateFrom),
    dateToLabel: formatDate(payment.dateTo),
  }));
}
