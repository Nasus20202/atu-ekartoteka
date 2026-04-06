import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

interface CreateAdminUserInput {
  email: string;
  hashedPassword: string;
  name: string | null;
  role: UserRole;
  status: AccountStatus;
}

export function createAdminUser({
  email,
  hashedPassword,
  name,
  role,
  status,
}: CreateAdminUserInput) {
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      status,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}
