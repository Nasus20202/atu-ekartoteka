import { UserRole } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

export function findFirstAdmin() {
  return prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
}
