import { prisma } from '@/lib/database/prisma';

export function findAllUserEmails() {
  return prisma.user.findMany({
    select: { email: true },
    where: { email: { not: undefined } },
  });
}
