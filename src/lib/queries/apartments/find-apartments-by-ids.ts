import { prisma } from '@/lib/database/prisma';

export function findApartmentsByIds(ids: string[]) {
  return prisma.apartment.findMany({
    where: { id: { in: ids } },
    include: { user: true },
  });
}
