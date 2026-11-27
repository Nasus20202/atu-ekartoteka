import { prisma } from '@/lib/platform/database/prisma';

/** The user's active apartments in the HOA, each flagged by whether it has voted. */
export function findVoterApartments(
  userId: string,
  hoaId: string,
  votingId: string
) {
  return prisma.apartment.findMany({
    where: { userId, homeownersAssociationId: hoaId, isActive: true },
    orderBy: { number: 'asc' },
    select: {
      id: true,
      address: true,
      building: true,
      number: true,
      votingBallots: { where: { votingId }, select: { id: true } },
    },
  });
}

/** Ids of the user's active apartments in the HOA that have not voted yet. */
export async function findVotableApartmentIds(
  userId: string,
  hoaId: string,
  votingId: string
): Promise<string[]> {
  const apartments = await prisma.apartment.findMany({
    where: {
      userId,
      homeownersAssociationId: hoaId,
      isActive: true,
      votingBallots: { none: { votingId } },
    },
    select: { id: true },
  });

  return apartments.map((apartment) => apartment.id);
}

/** The user's own answers, taken from any one of their ballots (all carry the same). */
export function findOwnBallot(userId: string, votingId: string) {
  return prisma.votingBallot.findFirst({
    where: { userId, votingId },
    orderBy: { createdAt: 'asc' },
    select: { votes: { select: { questionId: true, choice: true } } },
  });
}
