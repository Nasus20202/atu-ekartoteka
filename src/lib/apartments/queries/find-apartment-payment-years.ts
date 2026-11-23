import { prisma } from '@/lib/platform/database/prisma';
import { paymentsFromYear } from '@/lib/shared/utils/history-window';

export async function findApartmentPaymentYears(
  apartmentId: string,
  userId: string,
  startYear: number
) {
  const payments = await prisma.payment.findMany({
    where: {
      apartmentId,
      apartment: { userId },
      ...paymentsFromYear(startYear),
    },
    select: { year: true },
    orderBy: { year: 'desc' },
  });
  return payments.map(({ year }) => year);
}
