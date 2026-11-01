import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { deriveApartmentPayments } from '@/lib/queries/payments/derive-apartment-payments';
import { chargesFromYear } from '@/lib/utils/history-window';

export async function findApartmentWithPaymentsByYear(
  apartmentId: string,
  userId: string,
  year: number,
  startYear: number,
  maxPeriod: string
) {
  if (year < startYear) {
    return null;
  }

  const apartment = await prisma.apartment.findFirst({
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

  if (!apartment) {
    return null;
  }

  const [derived] = await deriveApartmentPayments([apartment], maxPeriod);
  return derived;
}

export const findApartmentWithPaymentsByYearCached = cache(
  findApartmentWithPaymentsByYear
);
