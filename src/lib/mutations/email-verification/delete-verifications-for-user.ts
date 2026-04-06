import { prisma } from '@/lib/database/prisma';

export function deleteVerificationsForUser(userId: string) {
  return prisma.emailVerification.deleteMany({
    where: { userId },
  });
}
