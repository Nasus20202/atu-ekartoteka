import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';

export const findOwnedApartmentLabel = cache(
  (apartmentId: string, userId: string) =>
    prisma.apartment.findFirst({
      where: { id: apartmentId, userId },
      select: { address: true, building: true, number: true },
    })
);

export const findApartmentWithHoaName = cache((apartmentId: string) =>
  prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: {
      number: true,
      homeownersAssociation: { select: { name: true } },
    },
  })
);
