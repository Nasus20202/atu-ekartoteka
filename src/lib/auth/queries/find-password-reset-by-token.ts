import { prisma } from '@/lib/platform/database/prisma';

export function findPasswordResetByToken(hashedToken: string) {
  return prisma.passwordReset.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });
}
