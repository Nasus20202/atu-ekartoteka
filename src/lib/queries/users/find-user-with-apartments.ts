import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { deriveApartmentPayments } from '@/lib/queries/payments/derive-apartment-payments';
import { chargesFromYear, paymentsFromYear } from '@/lib/utils/history-window';

export async function findUserWithApartments(
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
          charges: {
            where: chargesFromYear(startYear),
            orderBy: { period: 'desc' },
            select: { id: true, period: true, totalAmount: true },
          },
          chargeNotifications: {
            orderBy: { lineNo: 'asc' },
          },
          homeownersAssociation: {
            select: { id: true, name: true, header: true, footer: true },
          },
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

export const findUserWithApartmentsCached = cache(findUserWithApartments);
