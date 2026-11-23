import {
  type ApartmentDetailDto,
  toApartmentDetailDto,
} from '@/lib/apartments/dto/apartment-dto';
import { findApartmentDetail } from '@/lib/apartments/queries/find-apartment-detail';
import { toChargePeriodItemDto } from '@/lib/charges/dto/charge-dto';
import { toPaymentPdfDto } from '@/lib/payments/dto/payment-dto';
import { dateToPeriod } from '@/lib/shared/utils/period';

/**
 * Admin apartment detail as a DTO, shared by the API route and the server page.
 * The caller supplies the date so this module needs no request context.
 */
export async function loadApartmentDetail(
  apartmentId: string,
  now: Date
): Promise<ApartmentDetailDto | null> {
  const apartment = await findApartmentDetail(apartmentId, dateToPeriod(now));

  if (!apartment) return null;

  return toApartmentDetailDto({
    ...apartment,
    charges: apartment.charges.map(toChargePeriodItemDto),
    payments: apartment.payments.map(toPaymentPdfDto),
  });
}
