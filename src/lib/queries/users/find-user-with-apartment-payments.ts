import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findUserWithApartmentPayments(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          homeownersAssociation: true,
          payments: {
            orderBy: { year: 'desc' },
          },
        },
      },
    },
  });
}

export const findUserWithApartmentPaymentsCached = cache(
  findUserWithApartmentPayments
);
