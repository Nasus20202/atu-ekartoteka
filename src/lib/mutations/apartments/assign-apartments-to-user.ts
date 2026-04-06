import { prisma } from '@/lib/database/prisma';

export async function assignApartmentsToUser(
  userId: string,
  apartmentIds: string[]
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    return tx.apartment.updateMany({
      where: { id: { in: apartmentIds }, userId: null },
      data: { userId },
    });
  });

  return result.count;
}
