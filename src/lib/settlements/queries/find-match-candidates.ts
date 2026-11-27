import { prisma } from '@/lib/platform/database/prisma';
import type { ApartmentAddress } from '@/lib/settlements/types/annual-settlement';
import type { ApartmentCandidate } from '@/lib/settlements/types/stored-data';

const select = {
  id: true,
  externalApartmentId: true,
  homeownersAssociationId: true,
  owner: true,
  address: true,
  building: true,
  number: true,
  validFrom: true,
  validTo: true,
} as const;

export function findCandidatesByExternalId(
  externalApartmentId: string
): Promise<ApartmentCandidate[]> {
  return prisma.apartment.findMany({
    where: { externalApartmentId },
    select,
  });
}

/** Apartment records at a printed address; the street may carry a prefix. */
export function findCandidatesByAddress({
  street,
  building,
  number,
}: ApartmentAddress): Promise<ApartmentCandidate[]> {
  return prisma.apartment.findMany({
    where: {
      number: { equals: number, mode: 'insensitive' },
      building: { equals: building, mode: 'insensitive' },
      OR: [
        { address: { equals: street, mode: 'insensitive' } },
        { address: { endsWith: ` ${street}`, mode: 'insensitive' } },
      ],
    },
    select,
  });
}
