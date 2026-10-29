import type { findUserWithApartmentCharges } from '@/lib/queries/users/find-user-with-apartment-charges';
import {
  type ChargeDisplayDto,
  type ChargeDtoSource,
  toChargeDisplayDto,
} from '@/lib/types/dto/charge-dto';

type ChargesUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartmentCharges>>
>;
type ChargesApartment = ChargesUser['apartments'][number];

export type ApartmentPeriodData = {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplayDto[];
};

export function groupApartmentChargesByPeriod(
  apartments: ChargesApartment[]
): Record<string, ApartmentPeriodData[]> {
  const chargesByPeriod: Record<string, ApartmentPeriodData[]> = {};

  for (const apartment of apartments) {
    const apartmentLabel =
      `${apartment.address || ''} ${apartment.building || ''}/${apartment.number}`
        .replace(/\s+\//g, ' /')
        .trim();

    for (const charge of apartment.charges) {
      if (!chargesByPeriod[charge.period]) {
        chargesByPeriod[charge.period] = [];
      }

      const periodData = chargesByPeriod[charge.period];
      let apartmentData = periodData.find(
        (a) => a.apartmentNumber === apartment.number
      );

      if (!apartmentData) {
        apartmentData = {
          apartmentNumber: apartment.number,
          apartmentAddress: apartmentLabel,
          hoaName: apartment.homeownersAssociation.name,
          charges: [],
        };
        periodData.push(apartmentData);
      }

      apartmentData.charges.push(toChargeDisplayDto(charge));
    }
  }

  return chargesByPeriod;
}

export function getSortedPeriods(chargesByPeriod: Record<string, unknown>) {
  return Object.keys(chargesByPeriod).sort().reverse();
}

export function getCommonChargesDataDate(
  apartments: ChargesApartment[]
): string | null {
  const chargesDataDates = apartments
    .map((a) => a.homeownersAssociation.chargesDataDate)
    .filter((date): date is Date => date !== null);

  if (chargesDataDates.length !== apartments.length) {
    return null;
  }

  return new Date(
    Math.max(...chargesDataDates.map((d) => d.getTime()))
  ).toISOString();
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
