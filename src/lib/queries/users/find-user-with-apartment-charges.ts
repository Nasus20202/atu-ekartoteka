import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { chargesInWindow } from '@/lib/utils/history-window';

export function findUserWithApartmentCharges(
  id: string,
  startYear: number,
  cutoffPeriod: string | null
) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        include: {
          homeownersAssociation: true,
          charges: {
            where: chargesInWindow(startYear, cutoffPeriod),
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
