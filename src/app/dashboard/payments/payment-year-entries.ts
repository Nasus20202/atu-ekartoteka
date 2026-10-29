import type { findUserWithApartmentPayments } from '@/lib/queries/users/find-user-with-apartment-payments';
import { toPaymentListItemDto } from '@/lib/types/dto/payment-dto';
import { APP_LOCALE } from '@/lib/utils/locale';

type PaymentsUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartmentPayments>>
>;
type PaymentsApartment = PaymentsUser['apartments'][number];

export function toPaymentYearEntries(apartment: PaymentsApartment) {
  const apartmentLabel = `${apartment.address} ${apartment.building || ''}/${apartment.number}`;

  return apartment.payments.map((payment) => ({
    payment: toPaymentListItemDto(payment),
    apartmentId: apartment.id,
    apartmentLabel,
    hoaName: apartment.homeownersAssociation.name,
    dateFromLabel: payment.dateFrom.toLocaleDateString(APP_LOCALE),
    dateToLabel: payment.dateTo.toLocaleDateString(APP_LOCALE),
  }));
}
