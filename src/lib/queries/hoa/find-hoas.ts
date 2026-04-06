import { prisma } from '@/lib/database/prisma';

export function findHoas(search: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { externalId: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  return prisma.homeownersAssociation.findMany({
    where,
    select: {
      id: true,
      externalId: true,
      name: true,
      apartmentsDataDate: true,
      chargesDataDate: true,
      notificationsDataDate: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          apartments: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}
