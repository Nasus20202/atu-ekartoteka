import { prisma } from '@/lib/platform/database/prisma';

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}
