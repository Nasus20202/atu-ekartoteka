import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { getHistoryStartPeriod } from '@/lib/utils/history-window';

export function findUserWithApartmentCharges(id: string, startYear: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        include: {
          homeownersAssociation: true,
          charges: {
            where: { period: { gte: getHistoryStartPeriod(startYear) } },
            orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
          },
        },
      },
    },
  });
}

export const findUserWithApartmentChargesCached = cache(
  findUserWithApartmentCharges
);
