import { prisma } from '@/lib/platform/database/prisma';
import { VotingStatus } from '@/lib/voting/types/voting';

/** Number of votings in each status; a status without votings counts 0. */
export async function countVotingsByStatus(): Promise<
  Record<VotingStatus, number>
> {
  const groups = await prisma.voting.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    Object.values(VotingStatus).map((status) => [status, 0])
  ) as Record<VotingStatus, number>;
  for (const group of groups) {
    counts[group.status] = group._count._all;
  }
  return counts;
}
