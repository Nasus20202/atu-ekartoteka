import { isApprovedStatus } from '@/lib/auth/account-access';
import { AccountStatus } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

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
      : isApprovedStatus(status) && apartmentIds.length > 0
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
