import { prisma } from '@/lib/database/prisma';

interface UpdateUserProfileInput {
  id: string;
  name?: string | null;
  password?: string;
  mustChangePassword?: boolean;
}

export function updateUserProfile({ id, ...data }: UpdateUserProfileInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });
}
