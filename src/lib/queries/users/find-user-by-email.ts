import { normalizeEmail } from '@/lib/auth/email';
import { prisma } from '@/lib/database/prisma';

/**
 * Exact lookup on the normalised form. Every write normalises the address, so
 * the unique index covers this query; an address that was never normalised
 * simply does not resolve.
 */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
}
