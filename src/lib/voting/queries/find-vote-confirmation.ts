import { prisma } from '@/lib/platform/database/prisma';

export function findVoteConfirmation(votingId: string, userId: string) {
  return prisma.votingConfirmation.findUnique({
    where: { votingId_userId: { votingId, userId } },
    select: {
      id: true,
      codeHash: true,
      answers: true,
      attempts: true,
      expiresAt: true,
    },
  });
}
