import { prisma } from '@/lib/database/prisma';

/**
 * Marks the verification and the user atomically. Returns false when the
 * verification was already consumed by a concurrent request.
 */
export function verifyEmailTransaction(userId: string, verificationId: string) {
  return prisma.$transaction(async (tx) => {
    const consumed = await tx.emailVerification.updateMany({
      where: { id: verificationId, verified: false },
      data: { verified: true },
    });

    if (consumed.count === 0) {
      return false;
    }

    await tx.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    return true;
  });
}
