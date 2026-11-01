import type { Prisma } from '@/generated/prisma/client';
import { ApartmentEntry } from '@/lib/parsers/apartment-parser';

export const EXISTING_APARTMENT_SELECT = {
  id: true,
  externalOwnerId: true,
  externalApartmentId: true,
  owner: true,
  email: true,
  address: true,
  building: true,
  number: true,
  postalCode: true,
  city: true,
  shareNumerator: true,
  shareDenominator: true,
  validFrom: true,
  validTo: true,
  isActive: true,
  homeownersAssociationId: true,
} as const;

export type ExistingApartment = Prisma.ApartmentGetPayload<{
  select: typeof EXISTING_APARTMENT_SELECT;
}>;

export type ApartmentMapRow = Pick<
  ExistingApartment,
  'id' | 'externalOwnerId' | 'externalApartmentId'
>;

export const APARTMENT_MAP_SELECT = {
  id: true,
  externalOwnerId: true,
  externalApartmentId: true,
} as const;

export function buildApartmentMap(
  apartments: ApartmentMapRow[]
): Map<string, string> {
  return new Map(
    apartments.map((a) => [
      `${a.externalOwnerId}#${a.externalApartmentId}`,
      a.id,
    ])
  );
}

/** Start of the UTC day that `now` falls on; owner end dates are stored at midnight UTC. */
export function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/** An owner whose period ended on or before the import day is no longer active. */
export function isOwnershipEnded(validTo: Date | null, now: Date): boolean {
  return validTo !== null && validTo.getTime() <= startOfUtcDay(now).getTime();
}

function isSameDate(a: Date | null, b: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

export function hasApartmentChanged(
  existing: ExistingApartment,
  entry: ApartmentEntry,
  hoaId: string,
  now: Date
): boolean {
  return (
    existing.owner !== (entry.owner || null) ||
    existing.email !== (entry.email || null) ||
    existing.address !== (entry.address || null) ||
    existing.building !== (entry.building || null) ||
    existing.number !== entry.number ||
    existing.postalCode !== (entry.postalCode || null) ||
    existing.city !== (entry.city || null) ||
    existing.shareNumerator !== entry.shareNumerator ||
    existing.shareDenominator !== entry.shareDenominator ||
    !isSameDate(existing.validFrom, entry.validFrom) ||
    !isSameDate(existing.validTo, entry.validTo) ||
    existing.isActive !== !isOwnershipEnded(entry.validTo, now) ||
    existing.homeownersAssociationId !== hoaId
  );
}
