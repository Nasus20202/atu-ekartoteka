import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { getHistoryStartPeriod } from '@/lib/utils/history-window';

export function findUserWithApartments(id: string, startYear: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          charges: {
            where: { period: { gte: getHistoryStartPeriod(startYear) } },
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
            where: { year: { gte: startYear } },
            orderBy: { year: 'desc' },
          },
        },
      },
    },
  });
}

export const findUserWithApartmentsCached = cache(findUserWithApartments);
