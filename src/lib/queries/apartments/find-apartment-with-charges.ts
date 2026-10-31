import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { chargesInWindow } from '@/lib/utils/history-window';

export function findApartmentWithCharges(
  apartmentId: string,
  userId: string,
  startYear: number,
  cutoffPeriod: string | null
) {
  return prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId,
    },
    include: {
      charges: {
        where: chargesInWindow(startYear, cutoffPeriod),
        orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
      },
      homeownersAssociation: true,
    },
  });
}

export const findApartmentWithChargesCached = cache(findApartmentWithCharges);
