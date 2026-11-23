import { deriveApartmentPayments } from '@/lib/payments/queries/derive-apartment-payments';
import { prisma } from '@/lib/platform/database/prisma';

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
      homeownersAssociation: true,
    },
  });

  if (!apartment) {
    return null;
  }

  const [derived] = await deriveApartmentPayments([apartment], maxPeriod);
  return derived;
}
