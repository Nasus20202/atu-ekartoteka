import { prisma } from '@/lib/platform/database/prisma';

/** Apartments that can have a ballot: every active one of the HOA. */
export function countVotingApartments(hoaId: string) {
  return prisma.apartment.count({
    where: { homeownersAssociationId: hoaId, isActive: true },
  });
}
