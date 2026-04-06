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
    include: {
      _count: {
        select: {
          apartments: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}
