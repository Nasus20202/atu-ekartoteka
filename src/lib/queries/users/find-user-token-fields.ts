import { prisma } from '@/lib/database/prisma';

export function findUserTokenFields(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      mustChangePassword: true,
    },
  });
}
