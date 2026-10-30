import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { chargesFromYear } from '@/lib/utils/history-window';

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
        where: chargesFromYear(startYear),
        orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
      },
      homeownersAssociation: true,
    },
  });
}

export const findApartmentWithChargesCached = cache(findApartmentWithCharges);
