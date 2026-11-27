import { prisma } from '@/lib/platform/database/prisma';

export function deleteExpiredVoteConfirmations() {
  return prisma.votingConfirmation.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
