import { prisma } from '@/lib/database/prisma';

interface CreatePasswordResetInput {
  userId: string;
  hashedToken: string;
  expiresAt: Date;
}

export function createPasswordReset({
  userId,
  hashedToken,
  expiresAt,
}: CreatePasswordResetInput) {
  return prisma.passwordReset.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt,
    },
  });
}
