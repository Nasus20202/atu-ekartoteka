import { findApartmentDetail } from '@/lib/queries/apartments/find-apartment-detail';
import {
  type ApartmentDetailDto,
  toApartmentDetailDto,
} from '@/lib/types/dto/apartment-dto';
import { toChargePeriodItemDto } from '@/lib/types/dto/charge-dto';
import { toPaymentPdfDto } from '@/lib/types/dto/payment-dto';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

/** Admin apartment detail as a DTO, shared by the API route and the server page. */
export async function loadApartmentDetail(
  apartmentId: string
): Promise<ApartmentDetailDto | null> {
  const apartment = await findApartmentDetail(
    apartmentId,
    dateToPeriod(await getRequestNow())
  );

  if (!apartment) return null;

  return toApartmentDetailDto({
    ...apartment,
    charges: apartment.charges.map(toChargePeriodItemDto),
    payments: apartment.payments.map(toPaymentPdfDto),
  });
}
