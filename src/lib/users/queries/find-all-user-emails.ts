import { prisma } from '@/lib/platform/database/prisma';

export function findAllUserEmails() {
  return prisma.user.findMany({
    select: { email: true },
  });
}
