import type { findUserWithApartmentPayments } from '@/lib/queries/users/find-user-with-apartment-payments';
import { toPaymentListItemDto } from '@/lib/types/dto/payment-dto';

type PaymentsUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartmentPayments>>
>;
type PaymentsApartment = PaymentsUser['apartments'][number];

const DATE_LOCALE = 'pl-PL';

export function toPaymentYearEntries(apartment: PaymentsApartment) {
  const apartmentLabel = `${apartment.address} ${apartment.building || ''}/${apartment.number}`;

  return apartment.payments.map((payment) => ({
    payment: toPaymentListItemDto(payment),
    apartmentId: apartment.id,
    apartmentLabel,
    hoaName: apartment.homeownersAssociation.name,
    dateFromLabel: payment.dateFrom.toLocaleDateString(DATE_LOCALE),
    dateToLabel: payment.dateTo.toLocaleDateString(DATE_LOCALE),
  }));
}
