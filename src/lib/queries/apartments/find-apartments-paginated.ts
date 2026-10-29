import { prisma } from '@/lib/database/prisma';
import { compareApartmentsNaturally } from '@/lib/utils/apartment-sort';

interface FindApartmentsPaginatedOptions {
  where: object;
  skip: number;
  limit: number;
  hoaId?: string | null;
}

// Natural ordering cannot be done by the database, so only the sort keys of all
// matches are loaded; the full rows are fetched for the requested page alone.
export async function findApartmentsPaginated({
  where,
  skip,
  limit,
  hoaId,
}: FindApartmentsPaginatedOptions) {
  const [sortKeys, hoa] = await Promise.all([
    prisma.apartment.findMany({
      where,
      select: { id: true, building: true, number: true },
    }),
    hoaId
      ? prisma.homeownersAssociation.findUnique({
          where: { id: hoaId },
          select: { id: true, externalId: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const pageIds = sortKeys
    .sort(compareApartmentsNaturally)
    .slice(skip, skip + limit)
    .map(({ id }) => id);
  const pageRows = await prisma.apartment.findMany({
    where: { id: { in: pageIds } },
  });
  const rowsById = new Map(pageRows.map((row) => [row.id, row]));
  const apartments = pageIds.flatMap((id) => rowsById.get(id) ?? []);

  return [apartments, sortKeys.length, hoa] as const;
}
