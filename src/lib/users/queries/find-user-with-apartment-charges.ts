import { prisma } from '@/lib/platform/database/prisma';
import { chargesInWindow } from '@/lib/shared/utils/history-window';

export function findUserWithApartmentCharges(
  id: string,
  startYear: number,
  cutoffPeriod: string
) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      apartments: {
        include: {
          homeownersAssociation: true,
          charges: {
            where: chargesInWindow(startYear, cutoffPeriod),
            orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
          },
        },
      },
    },
  });
}
