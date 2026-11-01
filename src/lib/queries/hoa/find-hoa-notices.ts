import { prisma } from '@/lib/database/prisma';

export function findHoaNotices() {
  return prisma.homeownersAssociation.findMany({
    select: {
      id: true,
      externalId: true,
      name: true,
      header: true,
      footer: true,
    },
    orderBy: { name: 'asc' },
  });
}
