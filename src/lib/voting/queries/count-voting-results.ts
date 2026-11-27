import { prisma } from '@/lib/platform/database/prisma';
import type { VoteCountRow } from '@/lib/voting/dto/voting-dto';

/** Counts every choice per question in the database. */
export async function countVotingResults(
  votingId: string
): Promise<VoteCountRow[]> {
  const groups = await prisma.votingVote.groupBy({
    by: ['questionId', 'choice'],
    where: { ballot: { votingId } },
    _count: { _all: true },
  });

  return groups.map((group) => ({
    questionId: group.questionId,
    choice: group.choice,
    count: group._count._all,
  }));
}
