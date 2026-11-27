import type { PrismaClient } from '@/generated/prisma/client';
import type { TransactionClient } from '@/lib/import/types/import-context';
import { prisma } from '@/lib/platform/database/prisma';
import {
  annualData,
  utilityData,
} from '@/lib/settlements/mutations/settlement-data';
import { replacedWhere } from '@/lib/settlements/queries/replaced-where';
import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type { SavableRecord } from '@/lib/settlements/types/prepared-file';
import type { ReplacedPeriods } from '@/lib/settlements/types/stored-data';

const SAVE_TIMEOUT_MS = 60000;
// A clean import writes every file of the batch in one transaction
const CLEAN_IMPORT_TIMEOUT_MS = 300000;

export interface SettlementFileRecords {
  fileName: string;
  records: SavableRecord[];
}

// A record that is new is created, so that one stored in the meantime makes the
// file fail instead of being replaced without a confirmation
async function saveRecord(
  tx: TransactionClient,
  { type, record, apartment, status }: SavableRecord,
  fileName: string
) {
  const apartmentId = apartment.id;
  const replace = status === 'changed';

  if (type === 'utility') {
    const { header, summaries, lines, readings } = utilityData(
      record,
      fileName
    );
    const data = {
      ...header,
      summaries: { create: summaries },
      lines: { create: lines },
      readings: { create: readings },
    };
    if (!replace) {
      await tx.utilitySettlement.create({ data: { ...data, apartmentId } });
      return;
    }
    await tx.utilitySettlement.update({
      where: {
        apartmentId_periodFrom_periodTo: {
          apartmentId,
          periodFrom: header.periodFrom,
          periodTo: header.periodTo,
        },
      },
      data: {
        ...header,
        summaries: { deleteMany: {}, create: summaries },
        lines: { deleteMany: {}, create: lines },
        readings: { deleteMany: {}, create: readings },
      },
    });
    return;
  }

  const { header, items } = annualData(record, fileName);
  if (!replace) {
    await tx.annualCostSettlement.create({
      data: { ...header, apartmentId, items: { create: items } },
    });
    return;
  }
  await tx.annualCostSettlement.update({
    where: {
      apartmentId_periodFrom_periodTo: {
        apartmentId,
        periodFrom: header.periodFrom,
        periodTo: header.periodTo,
      },
    },
    data: { ...header, items: { deleteMany: {}, create: items } },
  });
}

/** Writes the records of one file; all of them or none. */
export async function saveSettlements(
  records: SavableRecord[],
  fileName: string
): Promise<void> {
  await (prisma as PrismaClient).$transaction(
    async (tx: TransactionClient) => {
      for (const record of records) {
        await saveRecord(tx, record, fileName);
      }
    },
    { timeout: SAVE_TIMEOUT_MS }
  );
}

/**
 * Removes the stored settlements of the given periods and writes the records of
 * all files, in one transaction. Returns how many were removed of each kind.
 */
export async function replaceSettlements(
  replaced: ReplacedPeriods[],
  files: SettlementFileRecords[]
): Promise<Record<SettlementDocumentType, number>> {
  return (prisma as PrismaClient).$transaction(
    async (tx: TransactionClient) => {
      const removed = { utility: 0, annual: 0 };
      for (const scope of replaced) {
        const query = { where: replacedWhere(scope) };
        // The rows of a settlement are deleted with it
        const { count } =
          scope.type === 'utility'
            ? await tx.utilitySettlement.deleteMany(query)
            : await tx.annualCostSettlement.deleteMany(query);
        removed[scope.type] += count;
      }
      for (const { fileName, records } of files) {
        for (const record of records) {
          await saveRecord(tx, record, fileName);
        }
      }
      return removed;
    },
    { timeout: CLEAN_IMPORT_TIMEOUT_MS }
  );
}
