import { prisma } from '@/lib/database/prisma';

/**
 * Consumes the reset token and replaces the password atomically. Returns false
 * when the token was already used or expired in the meantime, so a replay of
 * the same request cannot overwrite a password set by the first one.
 */
export function resetPasswordTransaction(
  userId: string,
  hashedPassword: string,
  resetTokenId: string
) {
  return prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordReset.updateMany({
      where: {
        id: resetTokenId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    if (consumed.count === 0) {
      return false;
    }

    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  });
}
