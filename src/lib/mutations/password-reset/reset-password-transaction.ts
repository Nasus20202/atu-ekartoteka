import { prisma } from '@/lib/database/prisma';

export function resetPasswordTransaction(
  userId: string,
  hashedPassword: string,
  resetTokenId: string
) {
  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: resetTokenId },
      data: { used: true },
    }),
  ]);
}
