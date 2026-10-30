import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { paymentsFromYear } from '@/lib/utils/history-window';

export function findUserWithApartmentPayments(id: string, startYear: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          homeownersAssociation: true,
          payments: {
            where: paymentsFromYear(startYear),
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
