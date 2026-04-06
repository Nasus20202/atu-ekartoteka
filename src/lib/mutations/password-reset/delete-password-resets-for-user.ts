import { prisma } from '@/lib/database/prisma';

export function deletePasswordResetsForUser(userId: string) {
  return prisma.passwordReset.deleteMany({
    where: { userId },
  });
}
