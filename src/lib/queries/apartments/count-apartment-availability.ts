import { prisma } from '@/lib/database/prisma';

/** Counts the apartments that exist and those owned by someone other than `userId`. */
export async function countApartmentAvailability(
  ids: string[],
  userId: string
) {
  const [found, occupiedByOthers] = await Promise.all([
    prisma.apartment.count({ where: { id: { in: ids } } }),
    prisma.apartment.count({
      where: {
        id: { in: ids },
        AND: [{ userId: { not: null } }, { userId: { not: userId } }],
      },
    }),
  ]);

  return { found, occupiedByOthers };
}
