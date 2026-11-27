import { prisma } from '@/lib/platform/database/prisma';

/** The pending ballot behind an emailed link, found by the hash of its token. */
export function findVoteConfirmationByToken(tokenHash: string) {
  return prisma.votingConfirmation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      votingId: true,
      userId: true,
      answers: true,
      expiresAt: true,
    },
  });
}
