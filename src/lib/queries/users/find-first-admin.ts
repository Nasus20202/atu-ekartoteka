import { prisma } from '@/lib/database/prisma';
import { UserRole } from '@/lib/types';

export function findFirstAdmin() {
  return prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
}
