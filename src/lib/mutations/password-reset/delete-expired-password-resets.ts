import { prisma } from '@/lib/database/prisma';

export function deleteExpiredPasswordResets() {
  return prisma.passwordReset.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
    },
  });
}
