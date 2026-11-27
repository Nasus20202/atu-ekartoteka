import { prisma } from '@/lib/platform/database/prisma';

/** Who voted what, for the admin. */
export function findVotingBallots(votingId: string) {
  return prisma.votingBallot.findMany({
    where: { votingId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      apartment: { select: { address: true, building: true, number: true } },
      votes: { select: { questionId: true, choice: true } },
    },
  });
}
