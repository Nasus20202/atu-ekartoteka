import { prisma } from '@/lib/database/prisma';
import { hasEmail } from '@/lib/queries/apartments/has-email';

export function findUnassignedApartmentsForAssign(ids: string[]) {
  return prisma.apartment
    .findMany({
      where: {
        id: { in: ids },
        userId: null,
        email: { not: null },
      },
      select: { id: true, email: true },
    })
    .then((rows) => rows.filter(hasEmail));
}
