import { prisma } from '@/lib/database/prisma';

/**
 * Fields needed to validate a session against the database: the token cache
 * (mustChangePassword) and the admin access rule (role, status).
 */
export function findUserSessionFields(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      status: true,
      mustChangePassword: true,
    },
  });
}
