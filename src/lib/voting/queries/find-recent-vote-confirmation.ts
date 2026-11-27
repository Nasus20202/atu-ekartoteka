import { prisma } from '@/lib/platform/database/prisma';
import { rateLimitWindowStart } from '@/lib/voting/rules/confirmation-code';

/** The user's newest code issued inside the rate limit window, for any voting. */
export function findRecentVoteConfirmation(userId: string, now: Date) {
  return prisma.votingConfirmation.findFirst({
    where: { userId, createdAt: { gt: rateLimitWindowStart(now) } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
}
