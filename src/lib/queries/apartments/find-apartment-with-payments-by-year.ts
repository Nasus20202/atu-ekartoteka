import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findApartmentWithPaymentsByYear(
  apartmentId: string,
  userId: string,
  year: number
) {
  return prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId,
    },
    include: {
      payments: {
        where: { year },
      },
      charges: true,
      homeownersAssociation: true,
    },
  });
}

export const findApartmentWithPaymentsByYearCached = cache(
  findApartmentWithPaymentsByYear
);
