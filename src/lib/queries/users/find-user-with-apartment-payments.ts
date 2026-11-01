import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { deriveApartmentPayments } from '@/lib/queries/payments/derive-apartment-payments';
import { paymentsFromYear } from '@/lib/utils/history-window';

export async function findUserWithApartmentPayments(
  id: string,
  startYear: number,
  maxPeriod: string
) {
  const user = await prisma.user.findUnique({
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

  if (!user) {
    return null;
  }

  return {
    ...user,
    apartments: await deriveApartmentPayments(user.apartments, maxPeriod),
  };
}

export const findUserWithApartmentPaymentsCached = cache(
  findUserWithApartmentPayments
);
