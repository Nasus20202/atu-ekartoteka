import { deriveApartmentPayments } from '@/lib/payments/queries/derive-apartment-payments';
import { prisma } from '@/lib/platform/database/prisma';
import { paymentsFromYear } from '@/lib/shared/utils/history-window';

export async function findUserWithApartments(
  id: string,
  startYear: number,
  maxPeriod: string
) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          chargeNotifications: {
            orderBy: { lineNo: 'asc' },
          },
          homeownersAssociation: {
            select: { id: true, name: true, header: true, footer: true },
          },
          payments: {
            where: paymentsFromYear(startYear),
            orderBy: { year: 'desc' },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    apartments: await deriveApartmentPayments(user.apartments, maxPeriod),
  };
}
