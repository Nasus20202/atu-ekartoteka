import { prisma } from '@/lib/database/prisma';

interface FindApartmentsPaginatedOptions {
  where: object;
  skip: number;
  limit: number;
  hoaId?: string | null;
}

export function findApartmentsPaginated({
  where,
  hoaId,
}: Pick<FindApartmentsPaginatedOptions, 'where' | 'hoaId'>) {
  return Promise.all([
    prisma.apartment.findMany({ where }),
    prisma.apartment.count({ where }),
    hoaId
      ? prisma.homeownersAssociation.findUnique({
          where: { id: hoaId },
          select: { id: true, externalId: true, name: true },
        })
      : Promise.resolve(null),
  ]);
}
