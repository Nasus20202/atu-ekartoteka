import { prisma } from '@/lib/database/prisma';

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}
