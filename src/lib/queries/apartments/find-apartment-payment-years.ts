import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export async function findApartmentPaymentYears(
  apartmentId: string,
  userId: string,
  startYear: number
) {
  const payments = await prisma.payment.findMany({
    where: { apartmentId, apartment: { userId }, year: { gte: startYear } },
    select: { year: true },
    orderBy: { year: 'desc' },
  });
  return payments.map(({ year }) => year);
}

export const findApartmentPaymentYearsCached = cache(findApartmentPaymentYears);
