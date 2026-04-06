import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findUserWithApartmentCharges(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        include: {
          homeownersAssociation: true,
          charges: {
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
