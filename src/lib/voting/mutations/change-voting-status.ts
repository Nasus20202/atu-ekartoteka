import { prisma } from '@/lib/platform/database/prisma';
import type { VotingStatus } from '@/lib/voting/types/voting';

/** Moves the status only when it is still `from`; false when a concurrent change won. */
export async function changeVotingStatus(
  id: string,
  from: VotingStatus,
  to: VotingStatus
): Promise<boolean> {
  const result = await prisma.voting.updateMany({
    where: { id, status: from },
    data: { status: to },
  });

  return result.count > 0;
}
