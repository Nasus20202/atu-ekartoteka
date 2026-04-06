import { prisma } from '@/lib/database/prisma';

type EmailWhere = { in: string[] } | { notIn: string[] };

export function findUnassignedApartments(emailWhere: EmailWhere) {
  return prisma.apartment.findMany({
    where: {
      userId: null,
      email: { not: null, ...emailWhere },
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
      { building: 'asc' },
      { number: 'asc' },
    ],
  });
}
