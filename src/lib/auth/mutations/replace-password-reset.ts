import { prisma } from '@/lib/platform/database/prisma';

interface ReplacePasswordResetInput {
  userId: string;
  hashedToken: string;
  expiresAt: Date;
}

/**
 * Revokes the user's earlier reset tokens and stores the new one in one
 * transaction, so a failure never leaves the user with no valid token.
 */
export function replacePasswordReset({
  userId,
  hashedToken,
  expiresAt,
}: ReplacePasswordResetInput) {
  return prisma.$transaction([
    prisma.passwordReset.deleteMany({ where: { userId } }),
    prisma.passwordReset.create({
      data: { userId, token: hashedToken, expiresAt },
    }),
  ]);
}
