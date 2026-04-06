import { prisma } from '@/lib/database/prisma';

export function findApartmentDetail(apartmentId: string) {
  return prisma.apartment.findUnique({
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
}
