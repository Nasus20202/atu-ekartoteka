import { prisma } from '@/lib/platform/database/prisma';

export function updateHoaName(id: string, name: string) {
  return prisma.homeownersAssociation.update({
    where: { id },
    data: { name },
  });
}
