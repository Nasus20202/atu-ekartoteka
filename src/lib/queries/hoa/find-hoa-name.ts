import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export const findHoaName = cache((hoaId: string) =>
  prisma.homeownersAssociation.findUnique({
    where: { id: hoaId },
    select: { name: true },
  })
);
