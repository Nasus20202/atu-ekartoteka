import {
  ApartmentMap,
  EntityStats,
  HOAContext,
  TransactionClient,
} from '@/lib/import/types';
import { ApartmentEntry } from '@/lib/parsers/apartment-parser';

type ExistingApartment = {
  id: string;
  externalOwnerId: string;
  externalApartmentId: string;
  owner: string;
  email: string | null;
  address: string;
  building: string | null;
  number: string;
  postalCode: string;
  city: string;
  shareNumerator: number;
  shareDenominator: number;
  isActive: boolean;
  homeownersAssociationId: string;
};

function hasApartmentChanged(
  existing: ExistingApartment,
  entry: ApartmentEntry,
  hoaId: string
): boolean {
  return (
    existing.owner !== entry.owner ||
    existing.email !== (entry.email || null) ||
    existing.address !== entry.address ||
    existing.building !== entry.building ||
    existing.number !== entry.number ||
    existing.postalCode !== entry.postalCode ||
    existing.city !== entry.city ||
    existing.shareNumerator !== entry.shareNumerator ||
    existing.shareDenominator !== entry.shareDenominator ||
    existing.isActive !== true ||
    existing.homeownersAssociationId !== hoaId
  );
}

export async function importApartments(
  tx: TransactionClient,
  hoa: HOAContext,
  apartments: ApartmentEntry[],
  stats: EntityStats,
  errors: string[]
): Promise<ApartmentMap> {
  const ownerApartmentKeys = apartments.map(
    (a) => `${a.externalOwnerId}#${a.externalApartmentId}`
  );

  // Fetch all existing apartments with full data for comparison
  const existingApartments = await tx.apartment.findMany({
    where: { homeownersAssociationId: hoa.id },
  });

  const existingMap = new Map<string, ExistingApartment>(
    existingApartments.map((a: ExistingApartment) => [
      `${a.externalOwnerId}#${a.externalApartmentId}`,
      a,
    ])
  );

  const toCreate: ApartmentEntry[] = [];
  const toUpdate: Array<{ entry: ApartmentEntry; id: string }> = [];

  for (const apartment of apartments) {
    const key = `${apartment.externalOwnerId}#${apartment.externalApartmentId}`;
    const existing = existingMap.get(key);
    if (existing) {
      if (hasApartmentChanged(existing, apartment, hoa.id)) {
        toUpdate.push({ entry: apartment, id: existing.id });
      }
      // If not changed, skip (don't count as updated)
    } else {
      toCreate.push(apartment);
    }
  }

  // Batch create new apartments
  if (toCreate.length > 0) {
    try {
      await tx.apartment.createMany({
        data: toCreate.map((a) => ({
          externalOwnerId: a.externalOwnerId,
          externalApartmentId: a.externalApartmentId,
          owner: a.owner,
          email: a.email || null,
          address: a.address,
          building: a.building,
          number: a.number,
          postalCode: a.postalCode,
          city: a.city,
          shareNumerator: a.shareNumerator,
          shareDenominator: a.shareDenominator,
          isActive: true,
          homeownersAssociationId: hoa.id,
        })),
        skipDuplicates: true,
      });
      stats.created = toCreate.length;
    } catch (error) {
      errors.push(
        `Błąd tworzenia mieszkań: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped += toCreate.length;
    }
  }

  // Update only changed apartments
  for (const { entry, id } of toUpdate) {
    try {
      await tx.apartment.update({
        where: { id },
        data: {
          owner: entry.owner,
          email: entry.email || null,
          address: entry.address,
          building: entry.building,
          number: entry.number,
          postalCode: entry.postalCode,
          city: entry.city,
          shareNumerator: entry.shareNumerator,
          shareDenominator: entry.shareDenominator,
          isActive: true,
          homeownersAssociationId: hoa.id,
        },
      });
      stats.updated++;
    } catch (error) {
      errors.push(
        `Błąd aktualizacji mieszkania ${entry.externalOwnerId}#${entry.externalApartmentId}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped++;
    }
  }

  // Deactivate apartments not in file (those whose externalOwnerId#externalApartmentId is not in the file)
  // Only deactivate if we have apartments in the file (lok.txt was provided)
  const keysInFile = new Set(ownerApartmentKeys);
  if (apartments.length > 0) {
    const toDeactivate = existingApartments
      .filter(
        (a: ExistingApartment) =>
          a.isActive &&
          !keysInFile.has(`${a.externalOwnerId}#${a.externalApartmentId}`)
      )
      .map((a: ExistingApartment) => a.id);

    const deactivated =
      toDeactivate.length > 0
        ? await tx.apartment.updateMany({
            where: { id: { in: toDeactivate } },
            data: { isActive: false },
          })
        : { count: 0 };
    stats.deleted = deactivated.count;
  }

  // Build apartment lookup map (externalOwnerId#externalApartmentId -> id)
  const apartmentsInDb = await tx.apartment.findMany({
    where: { homeownersAssociationId: hoa.id, isActive: true },
    select: { id: true, externalOwnerId: true, externalApartmentId: true },
  });

  const map = new Map<string, string>(
    apartmentsInDb.map(
      (a: {
        id: string;
        externalOwnerId: string;
        externalApartmentId: string;
      }) => [`${a.externalOwnerId}#${a.externalApartmentId}`, a.id]
    )
  );

  const apartmentKeysInFile = new Set(ownerApartmentKeys);

  return { map, apartmentKeysInFile };
}
