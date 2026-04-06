import { prisma } from '@/lib/database/prisma';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export function findRecentVerification(userId: string) {
  return prisma.emailVerification.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS),
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
