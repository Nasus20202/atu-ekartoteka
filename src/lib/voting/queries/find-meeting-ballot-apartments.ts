import { prisma } from '@/lib/platform/database/prisma';
import { MAX_APARTMENT_OPTIONS } from '@/lib/voting/rules/voting-constants';

const containing = (search: string) => ({
  contains: search,
  mode: 'insensitive' as const,
});

/**
 * Active apartments of the voting's HOA that have no ballot yet. Every word of
 * the search has to be in the owner, the address, the building or the number.
 */
export function findMeetingBallotApartments(votingId: string, search: string) {
  const words = search.split(/[\s/]+/).filter(Boolean);

  return prisma.apartment.findMany({
    where: {
      isActive: true,
      homeownersAssociation: { votings: { some: { id: votingId } } },
      votingBallots: { none: { votingId } },
      AND: words.map((word) => ({
        OR: [
          { owner: containing(word) },
          { address: containing(word) },
          { building: containing(word) },
          { number: containing(word) },
        ],
      })),
    },
    orderBy: [
      { address: 'asc' },
      { building: 'asc' },
      { number: 'asc' },
      { id: 'asc' },
    ],
    take: MAX_APARTMENT_OPTIONS,
    select: {
      id: true,
      owner: true,
      address: true,
      building: true,
      number: true,
    },
  });
}
