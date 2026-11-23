import { prisma } from '@/lib/platform/database/prisma';

export function findUserProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      authMethod: true,
    },
  });
}
