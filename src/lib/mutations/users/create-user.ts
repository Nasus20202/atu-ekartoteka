import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

interface CreateUserInput {
  email: string;
  hashedPassword: string;
  name: string | null;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
}

export function createUser({
  email,
  hashedPassword,
  name,
  role,
  status,
  emailVerified,
}: CreateUserInput) {
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      status,
      emailVerified,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}
