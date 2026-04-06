import { prisma } from '@/lib/database/prisma';

interface CreateVerificationInput {
  userId: string;
  hashedCode: string;
  expiresAt: Date;
}

export function createEmailVerification({
  userId,
  hashedCode,
  expiresAt,
}: CreateVerificationInput) {
  return prisma.emailVerification.create({
    data: {
      userId,
      code: hashedCode,
      expiresAt,
    },
  });
}
