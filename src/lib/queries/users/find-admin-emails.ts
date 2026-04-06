import { prisma } from '@/lib/database/prisma';
import { UserRole } from '@/lib/types';

export function findAdminEmails() {
  return prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { email: true, name: true },
  });
}
