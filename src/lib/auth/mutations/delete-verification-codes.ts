import { prisma } from '@/lib/platform/database/prisma';

export function deleteVerificationById(id: string) {
  return prisma.emailVerification.delete({ where: { id } });
}

/** Removes the user's earlier codes, keeping the one that was just sent. */
export function deleteOtherVerificationsForUser(
  userId: string,
  keepId: string
) {
  return prisma.emailVerification.deleteMany({
    where: { userId, id: { not: keepId } },
  });
}
