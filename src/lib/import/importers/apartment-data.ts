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

export function hasApartmentChanged(
  existing: ExistingApartment,
  entry: ApartmentEntry,
  hoaId: string
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
    existing.isActive !== true ||
    existing.homeownersAssociationId !== hoaId
  );
}
