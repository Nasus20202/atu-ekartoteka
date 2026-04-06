import { prisma } from '@/lib/database/prisma';

export type AssignedAddressKey = {
  hoaId: string;
  building: string | null;
  number: string;
};

/**
 * Returns address keys (hoaId + building + number) for all apartments
 * that already have a user assigned. Used to detect when an unassigned
 * apartment shares an address with an already-occupied one.
 */
export async function findAssignedApartmentAddressKeys(): Promise<
  AssignedAddressKey[]
> {
  const rows = await prisma.apartment.findMany({
    where: { userId: { not: null } },
    select: {
      building: true,
      number: true,
      homeownersAssociationId: true,
    },
  });

  return rows.map((r) => ({
    hoaId: r.homeownersAssociationId,
    building: r.building,
    number: r.number,
  }));
}
