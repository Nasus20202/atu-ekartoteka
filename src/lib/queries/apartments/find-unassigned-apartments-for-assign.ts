import { prisma } from '@/lib/database/prisma';

export function findUnassignedApartmentsForAssign(ids: string[]) {
  return (
    prisma.apartment
      .findMany({
        where: {
          id: { in: ids },
          userId: null,
          email: { not: null },
        },
        select: { id: true, email: true },
      })
      // The where clause already excludes null emails; Prisma cannot narrow the type.
      .then((rows) => rows as Array<(typeof rows)[number] & { email: string }>)
  );
}
