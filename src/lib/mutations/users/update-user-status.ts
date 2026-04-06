import { prisma } from '@/lib/database/prisma';
import { AccountStatus } from '@/lib/types';

interface UpdateUserStatusInput {
  userId: string;
  status: AccountStatus;
  apartmentIds?: string[];
}

export function updateUserStatus({
  userId,
  status,
  apartmentIds,
}: UpdateUserStatusInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      status,
      apartments:
        status === AccountStatus.APPROVED && apartmentIds?.length
          ? { set: apartmentIds.map((id) => ({ id })) }
          : { set: [] },
    },
    include: { apartments: true },
  });
}
