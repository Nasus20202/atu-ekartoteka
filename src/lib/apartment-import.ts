import { getUniqueApartments, parseLokBuffer } from '@/lib/lok-parser';
import { prisma } from '@/lib/prisma';

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

  try {
    const entries = await parseLokBuffer(buffer);
    const apartments = getUniqueApartments(entries);

    // Find or create HOA
    let hoa = await prisma.homeownersAssociation.findUnique({
      where: { externalId: hoaId },
    });

    if (!hoa) {
      hoa = await prisma.homeownersAssociation.create({
        data: {
          externalId: hoaId,
          name: hoaId, // defaults to ID, admin can change later
        },
      });
    }

    const externalIdsInFile = new Set(apartments.map((a) => a.externalId));

    for (const apartment of apartments) {
      try {
        const existing = await prisma.apartment.findUnique({
          where: { externalId: apartment.externalId },
        });

        if (existing) {
          await prisma.apartment.update({
            where: { externalId: apartment.externalId },
            data: {
              owner: apartment.owner,
              address: apartment.address,
              building: apartment.building,
              number: apartment.number,
              postalCode: apartment.postalCode,
              city: apartment.city,
              area: apartment.area,
              height: apartment.height,
              isActive: true,
              homeownersAssociationId: hoa.id,
            },
          });
          result.updated++;
        } else {
          await prisma.apartment.create({
            data: {
              externalId: apartment.externalId,
              owner: apartment.owner,
              address: apartment.address,
              building: apartment.building,
              number: apartment.number,
              postalCode: apartment.postalCode,
              city: apartment.city,
              area: apartment.area,
              height: apartment.height,
              isActive: true,
              homeownersAssociationId: hoa.id,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to import ${apartment.externalId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
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

    return result;
  } catch (error) {
    result.errors.push(
      `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}
