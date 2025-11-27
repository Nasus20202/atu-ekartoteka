import {
  ApartmentMap,
  EntityStats,
  HOAContext,
  TransactionClient,
} from '@/lib/import/types';
import { ApartmentEntry } from '@/lib/parsers/apartment-parser';

type ExistingApartment = {
  id: string;
  externalId: string;
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
  const externalIdsInFile = new Set(apartments.map((a) => a.externalId));

  // Fetch all existing apartments with full data for comparison
  const existingApartments = await tx.apartment.findMany({
    where: { externalId: { in: Array.from(externalIdsInFile) } },
  });

  const existingMap = new Map<string, ExistingApartment>(
    existingApartments.map((a: ExistingApartment) => [a.externalId, a])
  );

  const toCreate: ApartmentEntry[] = [];
  const toUpdate: Array<{ entry: ApartmentEntry; id: string }> = [];

  for (const apartment of apartments) {
    const existing = existingMap.get(apartment.externalId);
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
          externalId: a.externalId,
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
        `Błąd aktualizacji mieszkania ${entry.externalId}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped++;
    }
  }

  // Deactivate apartments not in file
  const deactivated = await tx.apartment.updateMany({
    where: {
      homeownersAssociationId: hoa.id,
      externalId: { notIn: Array.from(externalIdsInFile) },
      isActive: true,
    },
    data: { isActive: false },
  });
  stats.deleted = deactivated.count;

  // Build apartment lookup map
  const apartmentsInDb = await tx.apartment.findMany({
    where: { homeownersAssociationId: hoa.id, isActive: true },
    select: { id: true, externalId: true },
  });

  const map = new Map<string, string>(
    apartmentsInDb.map((a: { id: string; externalId: string }) => [
      a.externalId,
      a.id,
    ])
  );

  return { map, externalIdsInFile };
}
