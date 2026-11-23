import { prisma } from '@/lib/platform/database/prisma';

export function deleteVerificationsForUser(userId: string) {
  return prisma.emailVerification.deleteMany({
    where: { userId },
  });
}
