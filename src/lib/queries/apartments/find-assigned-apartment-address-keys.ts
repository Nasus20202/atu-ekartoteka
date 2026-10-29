import { prisma } from '@/lib/database/prisma';

export type AssignedAddressKey = {
  hoaId: string;
  building: string | null;
  number: string;
};

/**
 * Returns address keys (hoaId + building + number) for the apartments of the
 * given HOAs that already have a user assigned. Used to detect when an
 * unassigned apartment shares an address with an already-occupied one.
 */
export async function findAssignedApartmentAddressKeys(
  hoaIds: string[]
): Promise<AssignedAddressKey[]> {
  const rows = await prisma.apartment.findMany({
    where: {
      userId: { not: null },
      homeownersAssociationId: { in: hoaIds },
    },
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
