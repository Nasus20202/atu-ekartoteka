import { prisma } from '@/lib/database/prisma';

/**
 * Fields needed to validate a session against the database: the token cache
 * (role, mustChangePassword) and the access rule (status).
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
