import { prisma } from '@/lib/database/prisma';

export function findPasswordResetByToken(hashedToken: string) {
  return prisma.passwordReset.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });
}
