import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findUserWithApartments(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          charges: {
            orderBy: { period: 'desc' },
            select: { id: true, period: true, totalAmount: true },
          },
          chargeNotifications: {
            orderBy: { lineNo: 'asc' },
          },
          homeownersAssociation: {
            select: { id: true, name: true, header: true },
          },
          payments: {
            orderBy: { year: 'desc' },
            take: 1,
          },
        },
      },
    },
  });
}

export const findUserWithApartmentsCached = cache(findUserWithApartments);
