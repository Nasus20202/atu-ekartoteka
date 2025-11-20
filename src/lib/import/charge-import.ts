import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { parseNalCzynszBuffer } from '@/lib/parsers/nal-czynsz-parser';

const logger = createLogger('import:charges');

export interface ChargeImportResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
}

export async function importChargesFromFile(
  filePath: string,
  hoaId: string
): Promise<ChargeImportResult> {
  const fs = await import('fs/promises');
  const result = await importChargesFromBuffer(
    await fs.readFile(filePath),
    hoaId
  );
  return result;
}

export async function importChargesFromBuffer(
  buffer: Buffer,
  hoaId: string
): Promise<ChargeImportResult> {
  const result: ChargeImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    total: 0,
    errors: [],
  };

  try {
    const entries = await parseNalCzynszBuffer(buffer);
    result.total = entries.length;

    const hoa = await prisma.homeownersAssociation.findUnique({
      where: { externalId: hoaId },
    });

    if (!hoa) {
      result.errors.push(`Homeowners Association with ID ${hoaId} not found`);
      return result;
    }

    // Fetch all apartments for this HOA at once
    const apartments = await prisma.apartment.findMany({
      where: {
        homeownersAssociationId: hoa.id,
        isActive: true,
      },
      select: {
        id: true,
        externalId: true,
      },
    });

    const apartmentMap = new Map(
      apartments.map((apt) => [apt.externalId, apt.id])
    );

    // Separate entries into those with valid apartments and those without
    const validEntries = [];
    for (const entry of entries) {
      const apartmentId = apartmentMap.get(entry.apartmentExternalId);
      if (apartmentId) {
        validEntries.push({ entry, apartmentId });
      } else {
        logger.debug(
          { apartmentExternalId: entry.apartmentExternalId, hoaId },
          'Skipping charge: apartment not found'
        );
        result.skipped++;
      }
    }

    if (validEntries.length === 0) {
      return result;
    }

    // Fetch all existing charges at once for comparison
    const existingCharges = await prisma.charge.findMany({
      where: {
        apartmentId: { in: validEntries.map((v) => v.apartmentId) },
        period: { in: [...new Set(validEntries.map((v) => v.entry.period))] },
      },
      select: {
        id: true,
        apartmentId: true,
        period: true,
        externalLineNo: true,
      },
    });

    const existingChargeMap = new Map(
      existingCharges.map((charge) => [
        `${charge.apartmentId}-${charge.period}-${charge.externalLineNo}`,
        charge.id,
      ])
    );

    // Separate into create and update batches
    const toCreate = [];
    const toUpdate = [];

    for (const { entry, apartmentId } of validEntries) {
      const key = `${apartmentId}-${entry.period}-${entry.lineNo}`;
      const existingId = existingChargeMap.get(key);

      const chargeData = {
        externalId: entry.id,
        dateFrom: entry.dateFrom,
        dateTo: entry.dateTo,
        description: entry.description,
        quantity: entry.quantity,
        unit: entry.unit,
        unitPrice: entry.unitPrice,
        totalAmount: entry.totalAmount,
      };

      if (existingId) {
        toUpdate.push({
          id: existingId,
          ...chargeData,
        });
      } else {
        toCreate.push({
          externalId: entry.id,
          externalLineNo: entry.lineNo,
          apartmentId,
          dateFrom: entry.dateFrom,
          dateTo: entry.dateTo,
          period: entry.period,
          description: entry.description,
          quantity: entry.quantity,
          unit: entry.unit,
          unitPrice: entry.unitPrice,
          totalAmount: entry.totalAmount,
        });
      }
    }

    // Bulk create
    if (toCreate.length > 0) {
      await prisma.charge.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      result.created = toCreate.length;
    }

    // Bulk update in batches
    if (toUpdate.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
        const batch = toUpdate.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((charge) =>
            prisma.charge.update({
              where: { id: charge.id },
              data: {
                externalId: charge.externalId,
                dateFrom: charge.dateFrom,
                dateTo: charge.dateTo,
                description: charge.description,
                quantity: charge.quantity,
                unit: charge.unit,
                unitPrice: charge.unitPrice,
                totalAmount: charge.totalAmount,
              },
            })
          )
        );
      }
      result.updated = toUpdate.length;
    }

    return result;
  } catch (error) {
    result.errors.push(
      `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}
