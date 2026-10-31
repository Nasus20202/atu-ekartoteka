import type { findUserWithApartmentPayments } from '@/lib/queries/users/find-user-with-apartment-payments';
import { toPaymentListItemDto } from '@/lib/types/dto/payment-dto';
import { formatDate } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

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
