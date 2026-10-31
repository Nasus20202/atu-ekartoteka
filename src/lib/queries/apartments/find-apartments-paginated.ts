import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/database/prisma';
import type { ApartmentSortKey, SortDirection } from '@/lib/utils/sort';

interface FindApartmentsPaginatedOptions {
  where: Prisma.ApartmentWhereInput;
  skip: number;
  limit: number;
  hoaId?: string | null;
  sort?: ApartmentSortKey;
  order?: SortDirection;
}

const NATURAL_ORDER: Prisma.ApartmentOrderByWithRelationInput[] = [
  { building: { sort: 'asc', nulls: 'first' } },
  { number: 'asc' },
  { id: 'asc' },
];

/** Prisma ordering for the apartments list; ties keep the natural order. */
export function buildOrderBy(
  sort: ApartmentSortKey | undefined,
  order: SortDirection
): Prisma.ApartmentOrderByWithRelationInput[] {
  switch (sort) {
    case 'label':
      return [
        { address: { sort: order, nulls: 'first' } },
        { building: { sort: order, nulls: 'first' } },
        { number: order },
        { id: 'asc' },
      ];
    case 'owner':
      return [
        { owner: { sort: order, nulls: order === 'asc' ? 'first' : 'last' } },
        ...NATURAL_ORDER,
      ];
    case 'share':
      return [
        {
          shareRatio: {
            sort: order,
            nulls: order === 'asc' ? 'last' : 'first',
          },
        },
        ...NATURAL_ORDER,
      ];
    case 'status':
      return [{ isActive: order === 'asc' ? 'desc' : 'asc' }, ...NATURAL_ORDER];
    default:
      return NATURAL_ORDER;
  }
}

/** One page of apartments, ordered and paginated by the database. */
export async function findApartmentsPaginated({
  where,
  skip,
  limit,
  hoaId,
  sort,
  order = 'asc',
}: FindApartmentsPaginatedOptions) {
  const [apartments, total, hoa] = await Promise.all([
    prisma.apartment.findMany({
      where,
      orderBy: buildOrderBy(sort, order),
      skip,
      take: limit,
    }),
    prisma.apartment.count({ where }),
    hoaId
      ? prisma.homeownersAssociation.findUnique({
          where: { id: hoaId },
          select: { id: true, externalId: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  return [apartments, total, hoa] as const;
}
