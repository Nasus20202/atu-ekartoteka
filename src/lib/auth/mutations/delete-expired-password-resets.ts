import { prisma } from '@/lib/platform/database/prisma';

export function deleteExpiredPasswordResets() {
  return prisma.passwordReset.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
    },
  });
}
