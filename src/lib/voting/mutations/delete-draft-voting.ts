import { prisma } from '@/lib/platform/database/prisma';
import { VotingStatus } from '@/lib/voting/types/voting';

export async function deleteDraftVoting(id: string): Promise<boolean> {
  const result = await prisma.voting.deleteMany({
    where: { id, status: VotingStatus.DRAFT },
  });

  return result.count > 0;
}
