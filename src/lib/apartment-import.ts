import { prisma } from '@/lib/prisma';
import {
  parseLokFile,
  parseLokBuffer,
  getUniqueApartments,
} from '@/lib/lok-parser';

export interface ImportResult {
  created: number;
  updated: number;
  deactivated: number;
  total: number;
  errors: string[];
}

export async function importApartmentsFromFile(
  filePath: string
): Promise<ImportResult> {
  const result = await importApartmentsFromBuffer(
    await require('fs/promises').readFile(filePath)
  );
  return result;
}

export async function importApartmentsFromBuffer(
  buffer: Buffer
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
