import { deriveApartmentPayments } from '@/lib/payments/queries/derive-apartment-payments';
import { prisma } from '@/lib/platform/database/prisma';

export async function findApartmentDetail(
  apartmentId: string,
  maxPeriod: string
) {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: {
      homeownersAssociation: {
        select: {
          id: true,
          externalId: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      charges: {
        orderBy: { period: 'desc' },
      },
      chargeNotifications: {
        orderBy: { lineNo: 'asc' },
      },
      payments: {
        orderBy: { year: 'desc' },
      },
    },
  });

  if (!apartment) {
    return null;
  }

  const [derived] = await deriveApartmentPayments([apartment], maxPeriod);
  return derived;
}
