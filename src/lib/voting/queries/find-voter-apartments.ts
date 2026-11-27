import { prisma } from '@/lib/platform/database/prisma';

const ownedBy = (userId: string, hoaId: string) => ({
  userId,
  homeownersAssociationId: hoaId,
  isActive: true,
});

const LABELLED = {
  id: true,
  address: true,
  building: true,
  number: true,
} as const;

const BY_ADDRESS = [
  { address: 'asc' },
  { building: 'asc' },
  { number: 'asc' },
] as const;

/** How many active apartments the user owns in the HOA. */
export function countVoterApartments(userId: string, hoaId: string) {
  return prisma.apartment.count({ where: ownedBy(userId, hoaId) });
}

/** The user's active apartments in the HOA that have not voted yet. */
export function findVotableApartments(
  userId: string,
  hoaId: string,
  votingId: string
) {
  return prisma.apartment.findMany({
    where: {
      ...ownedBy(userId, hoaId),
      votingBallots: { none: { votingId } },
    },
    orderBy: [...BY_ADDRESS],
    select: LABELLED,
  });
}

/** Those of the apartments that are active and the user's own in the HOA. */
export function findOwnedApartments(
  userId: string,
  hoaId: string,
  apartmentIds: string[]
) {
  return prisma.apartment.findMany({
    where: { ...ownedBy(userId, hoaId), id: { in: apartmentIds } },
    orderBy: [...BY_ADDRESS],
    select: LABELLED,
  });
}

/**
 * The ballots the user cast, and those an admin entered for the user's
 * apartments after a meeting.
 */
export function findOwnBallots(userId: string, votingId: string) {
  return prisma.votingBallot.findMany({
    where: {
      votingId,
      OR: [{ userId }, { userId: null, apartment: { userId, isActive: true } }],
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      userId: true,
      apartment: { select: { address: true, building: true, number: true } },
      votes: { select: { questionId: true, choice: true } },
    },
  });
}
