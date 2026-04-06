import { prisma } from '@/lib/database/prisma';

export function verifyEmailTransaction(userId: string, verificationId: string) {
  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.update({
      where: { id: verificationId },
      data: { verified: true },
    }),
  ]);
}
