import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export const findUserByIdCached = cache(findUserById);
