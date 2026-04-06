import { prisma } from '@/lib/database/prisma';

export function findUnassignedApartmentsByIds(ids: string[]) {
  return prisma.apartment.findMany({
    where: {
      id: { in: ids },
      userId: null,
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      owner: true,
    },
  });
}
