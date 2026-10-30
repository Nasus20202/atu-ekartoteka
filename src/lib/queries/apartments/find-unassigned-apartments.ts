import { prisma } from '@/lib/database/prisma';

export type EmailWhere = { in: string[] } | { notIn: string[] };

export function unassignedApartmentsWhere(emailWhere: EmailWhere) {
  return {
    userId: null,
    email: { not: null, ...emailWhere },
  };
}

export function findUnassignedApartments(
  emailWhere: EmailWhere,
  hoaIds: string[]
) {
  return prisma.apartment.findMany({
    where: {
      ...unassignedApartmentsWhere(emailWhere),
      homeownersAssociationId: { in: hoaIds },
    },
    select: {
      id: true,
      number: true,
      building: true,
      owner: true,
      email: true,
      isActive: true,
      homeownersAssociation: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { homeownersAssociation: { name: 'asc' } },
      { building: { sort: 'asc', nulls: 'first' } },
      { number: 'asc' },
      { id: 'asc' },
    ],
  });
}
