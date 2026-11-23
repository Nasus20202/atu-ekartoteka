import { prisma } from '@/lib/platform/database/prisma';
import { chargesInWindow } from '@/lib/shared/utils/history-window';

export function findApartmentWithCharges(
  apartmentId: string,
  userId: string,
  startYear: number,
  cutoffPeriod: string
) {
  return prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId,
    },
    include: {
      charges: {
        where: chargesInWindow(startYear, cutoffPeriod),
        orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
      },
      homeownersAssociation: true,
    },
  });
}
