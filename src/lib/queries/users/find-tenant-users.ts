import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

export function findTenantUsers(status?: AccountStatus | null) {
  const where = status
    ? { status, role: UserRole.TENANT }
    : { role: UserRole.TENANT };

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      emailVerified: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
      apartments: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  });
}
