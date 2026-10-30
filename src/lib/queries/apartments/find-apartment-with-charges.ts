import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { getHistoryStartPeriod } from '@/lib/utils/history-window';

export function findApartmentWithCharges(
  apartmentId: string,
  userId: string,
  startYear: number
) {
  return prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId,
    },
    include: {
      charges: {
        where: { period: { gte: getHistoryStartPeriod(startYear) } },
        orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
      },
      homeownersAssociation: true,
    },
  });
}

export const findApartmentWithChargesCached = cache(findApartmentWithCharges);
