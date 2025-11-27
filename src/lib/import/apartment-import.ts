import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import {
  getUniqueApartments,
  parseApartmentBuffer,
} from '@/lib/parsers/apartment-parser';

const logger = createLogger('import:apartments');

export interface ImportResult {
  created: number;
  updated: number;
  deactivated: number;
  total: number;
  errors: string[];
}

export interface FileWithHOA {
  hoaId: string;
  buffer: Buffer;
}

export async function importApartmentsFromFile(
  filePath: string,
  hoaId: string
): Promise<ImportResult> {
  const fs = await import('fs/promises');
  const result = await importApartmentsFromBuffer(
    await fs.readFile(filePath),
    hoaId
  );
  return result;
}

export async function importApartmentsFromBuffer(
  buffer: Buffer,
  hoaId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    deactivated: 0,
    total: 0,
    errors: [],
  };

  logger.info({ hoaId }, 'Starting apartment import');

  try {
    const entries = await parseApartmentBuffer(buffer);
    const apartments = getUniqueApartments(entries);

    // Find or create HOA
    let hoa = await prisma.homeownersAssociation.findUnique({
      where: { externalId: hoaId },
    });

    if (!hoa) {
      logger.info({ hoaId }, 'Creating new HOA');
      hoa = await prisma.homeownersAssociation.create({
        data: {
          externalId: hoaId,
          name: hoaId, // defaults to ID, admin can change later
        },
      });
    }

    const externalIdsInFile = new Set(apartments.map((a) => a.externalId));

    // Fetch all existing apartments for this HOA at once
    const existingApartments = await prisma.apartment.findMany({
      where: {
        externalId: { in: apartments.map((a) => a.externalId) },
      },
      select: {
        externalId: true,
      },
    });

    const existingIds = new Set(
      existingApartments.map(
        (apt: (typeof existingApartments)[number]) => apt.externalId
      )
    );

    // Separate into create and update batches
    const toCreate = [];
    const toUpdate = [];

    for (const apartment of apartments) {
      const apartmentData = {
        owner: apartment.owner,
        email: apartment.email || null,
        address: apartment.address,
        building: apartment.building,
        number: apartment.number,
        postalCode: apartment.postalCode,
        city: apartment.city,
        shareNumerator: apartment.shareNumerator,
        shareDenominator: apartment.shareDenominator,
        isActive: true,
        homeownersAssociationId: hoa.id,
      };

      if (existingIds.has(apartment.externalId)) {
        toUpdate.push({
          externalId: apartment.externalId,
          ...apartmentData,
        });
      } else {
        toCreate.push({
          externalId: apartment.externalId,
          ...apartmentData,
        });
      }
    }

    // Bulk create new apartments
    if (toCreate.length > 0) {
      try {
        await prisma.apartment.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        result.created = toCreate.length;
      } catch {
        // Fallback to individual creates on bulk error
        for (const apt of toCreate) {
          try {
            await prisma.apartment.create({
              data: apt,
            });
            result.created++;
          } catch (err) {
            result.errors.push(
              `Failed to import ${apt.externalId}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        }
      }
    }

    // Bulk update existing apartments in batches
    if (toUpdate.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
        const batch = toUpdate.slice(i, i + BATCH_SIZE);
        try {
          await prisma.$transaction(
            batch.map((apt) =>
              prisma.apartment.update({
                where: { externalId: apt.externalId },
                data: {
                  owner: apt.owner,
                  email: apt.email,
                  address: apt.address,
                  building: apt.building,
                  number: apt.number,
                  postalCode: apt.postalCode,
                  city: apt.city,
                  shareNumerator: apt.shareNumerator,
                  shareDenominator: apt.shareDenominator,
                  isActive: apt.isActive,
                  homeownersAssociationId: apt.homeownersAssociationId,
                },
              })
            )
          );
          result.updated += batch.length;
        } catch {
          // Fallback to individual updates on batch error
          for (const apt of batch) {
            try {
              await prisma.apartment.update({
                where: { externalId: apt.externalId },
                data: {
                  owner: apt.owner,
                  email: apt.email,
                  address: apt.address,
                  building: apt.building,
                  number: apt.number,
                  postalCode: apt.postalCode,
                  city: apt.city,
                  shareNumerator: apt.shareNumerator,
                  shareDenominator: apt.shareDenominator,
                  isActive: apt.isActive,
                  homeownersAssociationId: apt.homeownersAssociationId,
                },
              });
              result.updated++;
            } catch (err) {
              result.errors.push(
                `Failed to import ${apt.externalId}: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
            }
          }
        }
      }
    }

    const deactivated = await prisma.apartment.updateMany({
      where: {
        externalId: {
          notIn: Array.from(externalIdsInFile),
        },
        isActive: true,
        homeownersAssociationId: hoa.id,
      },
      data: {
        isActive: false,
      },
    });

    result.deactivated = deactivated.count;
    result.total = apartments.length;

    logger.info(
      {
        hoaId,
        created: result.created,
        updated: result.updated,
        deactivated: result.deactivated,
      },
      'Apartment import completed'
    );

    return result;
  } catch (error) {
    result.errors.push(
      `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}
