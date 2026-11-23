import { UserRole } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

export function findAdminEmails() {
  return prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { email: true, name: true },
  });
}
