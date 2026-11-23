import { prisma } from '@/lib/platform/database/prisma';

export function deleteExpiredVerifications() {
  return prisma.emailVerification.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { verified: true }],
    },
  });
}
