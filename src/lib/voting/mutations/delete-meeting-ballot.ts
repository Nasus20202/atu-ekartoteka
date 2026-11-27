import { prisma } from '@/lib/platform/database/prisma';
import { VotingStatus } from '@/lib/voting/types/voting';

/** Removes a ballot entered by an admin, only while the voting is a draft. */
export async function deleteMeetingBallot(
  votingId: string,
  ballotId: string
): Promise<boolean> {
  const { count } = await prisma.votingBallot.deleteMany({
    where: {
      id: ballotId,
      votingId,
      userId: null,
      voting: { status: VotingStatus.DRAFT },
    },
  });

  return count > 0;
}
