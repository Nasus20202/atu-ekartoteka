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
  const apartmentsUpdate =
    apartmentIds === undefined
      ? undefined
      : status === AccountStatus.APPROVED && apartmentIds.length > 0
        ? { set: apartmentIds.map((id) => ({ id })) }
        : { set: [] };

  return prisma.user.update({
    where: { id: userId },
    data: {
      status,
      ...(apartmentsUpdate ? { apartments: apartmentsUpdate } : {}),
    },
    include: { apartments: true },
  });
}
