import { prisma } from '@/lib/platform/database/prisma';

export async function deleteVoteConfirmation(id: string): Promise<void> {
  await prisma.votingConfirmation.deleteMany({ where: { id } });
}
