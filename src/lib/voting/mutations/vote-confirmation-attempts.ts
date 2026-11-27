import { prisma } from '@/lib/platform/database/prisma';

/**
 * Counts one attempt atomically, before the code is compared, so parallel
 * guesses cannot exceed the limit. Null when the confirmation is gone.
 */
export async function registerConfirmationAttempt(
  id: string
): Promise<number | null> {
  const result = await prisma.votingConfirmation.updateManyAndReturn({
    where: { id },
    data: { attempts: { increment: 1 } },
    select: { attempts: true },
  });

  return result[0]?.attempts ?? null;
}

export async function deleteVoteConfirmation(id: string): Promise<void> {
  await prisma.votingConfirmation.deleteMany({ where: { id } });
}
