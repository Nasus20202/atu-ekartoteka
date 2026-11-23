import { prisma } from '@/lib/platform/database/prisma';

export function deletePasswordResetsForUser(userId: string) {
  return prisma.passwordReset.deleteMany({
    where: { userId },
  });
}
