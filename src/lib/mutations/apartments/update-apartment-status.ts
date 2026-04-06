import { prisma } from '@/lib/database/prisma';

export function updateApartmentStatus(apartmentId: string, isActive: boolean) {
  return prisma.apartment.update({
    where: { id: apartmentId },
    data: { isActive },
  });
}
