import { IMPORT_CREATE_BATCH_SIZE } from '@/lib/import/constants';
import {
  APARTMENT_MAP_SELECT,
  type ApartmentMapRow,
  buildApartmentMap,
  EXISTING_APARTMENT_SELECT,
  type ExistingApartment,
  hasApartmentChanged,
} from '@/lib/import/importers/apartment-data';
import {
  ApartmentMap,
  EntityStats,
  HOAContext,
  TransactionClient,
} from '@/lib/import/types';
import { processInBatches } from '@/lib/import/utils';
import { ApartmentEntry } from '@/lib/parsers/apartment-parser';
import { getErrorMessage } from '@/lib/utils/error-message';

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
  const apartmentKeysInFile = new Set(ownerApartmentKeys);

  if (apartments.length === 0) {
    const apartmentsInDb = await tx.apartment.findMany({
      where: { homeownersAssociationId: hoa.id },
      select: APARTMENT_MAP_SELECT,
    });

    return {
      map: buildApartmentMap(apartmentsInDb),
      apartmentKeysInFile,
    };
  }

  // Fetch all existing apartments with full data for comparison
  const existingApartments = await tx.apartment.findMany({
    where: { homeownersAssociationId: hoa.id },
    select: EXISTING_APARTMENT_SELECT,
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
      await processInBatches(
        toCreate,
        IMPORT_CREATE_BATCH_SIZE,
        async (batch) => {
          await tx.apartment.createMany({
            data: batch.map((a) => ({
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
        }
      );
      stats.created = toCreate.length;
    } catch (error) {
      errors.push(`Błąd tworzenia mieszkań: ${getErrorMessage(error)}`);
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
        `Błąd aktualizacji mieszkania ${entry.externalOwnerId}#${entry.externalApartmentId}: ${getErrorMessage(error)}`
      );
      stats.skipped++;
    }
  }

  // Deactivate apartments not in file (those whose externalOwnerId#externalApartmentId is not in the file)
  const toDeactivate = existingApartments
    .filter(
      (a: ExistingApartment) =>
        a.isActive &&
        !apartmentKeysInFile.has(
          `${a.externalOwnerId}#${a.externalApartmentId}`
        )
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

  const apartmentsInDb =
    toCreate.length > 0
      ? await tx.apartment.findMany({
          where: { homeownersAssociationId: hoa.id },
          select: APARTMENT_MAP_SELECT,
        })
      : existingApartments.map(
          ({ id, externalOwnerId, externalApartmentId }: ApartmentMapRow) => ({
            id,
            externalOwnerId,
            externalApartmentId,
          })
        );

  return {
    map: buildApartmentMap(apartmentsInDb),
    apartmentKeysInFile,
  };
}
