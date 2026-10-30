import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { chargesFromYear } from '@/lib/utils/history-window';

export async function findApartmentWithPaymentsByYear(
  apartmentId: string,
  userId: string,
  year: number,
  startYear: number
) {
  if (year < startYear) {
    return null;
  }

  return prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId,
    },
    include: {
      payments: {
        where: { year },
      },
      charges: {
        where: chargesFromYear(startYear),
      },
      homeownersAssociation: true,
    },
  });
}

export const findApartmentWithPaymentsByYearCached = cache(
  findApartmentWithPaymentsByYear
);
