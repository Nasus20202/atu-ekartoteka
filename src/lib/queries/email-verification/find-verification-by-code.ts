import { prisma } from '@/lib/database/prisma';

export function findVerificationByCode(hashedCode: string) {
  return prisma.emailVerification.findUnique({
    where: { code: hashedCode },
    include: { user: true },
  });
}

export function findVerificationByCodeMinimal(hashedCode: string) {
  return prisma.emailVerification.findUnique({
    where: { code: hashedCode },
    select: {
      id: true,
      verified: true,
      expiresAt: true,
      user: {
        select: {
          email: true,
          emailVerified: true,
        },
      },
    },
  });
}
