import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findApartmentWithCharges(apartmentId: string, userId: string) {
  return prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId,
    },
    include: {
      charges: {
        orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
      },
      homeownersAssociation: true,
    },
  });
}

export const findApartmentWithChargesCached = cache(findApartmentWithCharges);
