import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export function findUserProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      authMethod: true,
    },
  });
}

export const findUserProfileCached = cache(findUserProfile);
