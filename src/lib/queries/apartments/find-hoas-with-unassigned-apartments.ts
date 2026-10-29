import { prisma } from '@/lib/database/prisma';
import {
  type EmailWhere,
  unassignedApartmentsWhere,
} from '@/lib/queries/apartments/find-unassigned-apartments';

interface HoaPage {
  skip: number;
  limit: number;
}

/** One page of HOAs that have unassigned apartments, plus the total count. */
export function findHoasWithUnassignedApartments(
  emailWhere: EmailWhere,
  { skip, limit }: HoaPage
) {
  const where = {
    apartments: { some: unassignedApartmentsWhere(emailWhere) },
  };

  return Promise.all([
    prisma.homeownersAssociation.findMany({
      where,
      select: { id: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.homeownersAssociation.count({ where }),
  ]);
}
