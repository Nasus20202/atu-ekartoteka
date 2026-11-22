import type { findUserWithApartmentCharges } from '@/lib/queries/users/find-user-with-apartment-charges';
import {
  type ChargeDisplayDto,
  type ChargeDtoSource,
  toChargeDisplayDto,
} from '@/lib/types/dto/charge-dto';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

type ChargesUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartmentCharges>>
>;
type ChargesApartment = ChargesUser['apartments'][number];

export type ApartmentPeriodData = {
  apartmentId: string;
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplayDto[];
};

export function groupApartmentChargesByPeriod(
  apartments: ChargesApartment[]
): Record<string, ApartmentPeriodData[]> {
  const byPeriod = new Map<string, Map<string, ApartmentPeriodData>>();

  for (const apartment of apartments) {
    const apartmentLabel = formatApartmentLabel(apartment);

    for (const charge of apartment.charges) {
      const periodData =
        byPeriod.get(charge.period) ?? new Map<string, ApartmentPeriodData>();
      byPeriod.set(charge.period, periodData);

      let apartmentData = periodData.get(apartment.id);

      if (!apartmentData) {
        apartmentData = {
          apartmentId: apartment.id,
          apartmentNumber: apartment.number,
          apartmentAddress: apartmentLabel,
          hoaName: apartment.homeownersAssociation.name,
          charges: [],
        };
        periodData.set(apartment.id, apartmentData);
      }

      apartmentData.charges.push(toChargeDisplayDto(charge));
    }
  }

  return Object.fromEntries(
    Array.from(byPeriod, ([period, apartmentsById]) => [
      period,
      Array.from(apartmentsById.values()),
    ])
  );
}

export function getSortedPeriods(chargesByPeriod: Record<string, unknown>) {
  return Object.keys(chargesByPeriod).sort().reverse();
}

export function groupChargesByPeriod(
  charges: (ChargeDtoSource & { period: string })[]
): Record<string, ChargeDisplayDto[]> {
  const chargesByPeriod: Record<string, ChargeDisplayDto[]> = {};

  for (const charge of charges) {
    if (!chargesByPeriod[charge.period]) {
      chargesByPeriod[charge.period] = [];
    }

    chargesByPeriod[charge.period].push(toChargeDisplayDto(charge));
  }

  return chargesByPeriod;
}

// URL param is YYYY-MM, DB periods are YYYYMM
export function toActivePeriod(month: string | undefined): string | null {
  return month ? month.replace('-', '') : null;
}
