import { prisma } from '@/lib/database/prisma';
import { deriveApartmentPayments } from '@/lib/queries/payments/derive-apartment-payments';

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
