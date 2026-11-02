import { normalizeEmail } from '@/lib/auth/email';
import { prisma } from '@/lib/database/prisma';

/**
 * Case-insensitive lookup so rows created before email normalisation keep
 * working. Normalised writes make the index an exact match for new accounts.
 */
export function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: normalizeEmail(email), mode: 'insensitive' } },
  });
}
