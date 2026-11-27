import { prisma } from '@/lib/platform/database/prisma';

/** The user's own apartments, as needed to choose one and name it. */
export function findUserApartmentOptions(userId: string) {
  return prisma.apartment.findMany({
    where: { userId },
    select: {
      id: true,
      address: true,
      building: true,
      number: true,
      owner: true,
      homeownersAssociation: { select: { name: true } },
    },
    orderBy: [{ address: 'asc' }, { number: 'asc' }, { id: 'asc' }],
  });
}
