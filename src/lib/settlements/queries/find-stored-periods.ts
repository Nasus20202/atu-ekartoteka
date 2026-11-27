import { prisma } from '@/lib/platform/database/prisma';
import { replacedWhere } from '@/lib/settlements/queries/replaced-where';
import { dateToIso, isoToDate } from '@/lib/settlements/rules/periods';
import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type {
  ReplacedPeriods,
  StoredPeriod,
} from '@/lib/settlements/types/stored-data';

/**
 * Stored periods of the apartment that share days with the given one, without
 * the record of exactly that period and without those a clean import removes.
 */
export async function findOverlappingPeriods(
  type: SettlementDocumentType,
  apartmentId: string,
  { periodFrom, periodTo }: StoredPeriod,
  replaced: ReplacedPeriods[] = []
): Promise<StoredPeriod[]> {
  const from = isoToDate(periodFrom);
  const to = isoToDate(periodTo);
  const query = {
    where: {
      apartmentId,
      periodFrom: { lte: to },
      periodTo: { gte: from },
      NOT: [
        { periodFrom: from, periodTo: to },
        ...replaced.filter((scope) => scope.type === type).map(replacedWhere),
      ],
    },
    select: { periodFrom: true, periodTo: true },
    orderBy: { periodFrom: 'asc' as const },
  };
  const rows =
    type === 'utility'
      ? await prisma.utilitySettlement.findMany(query)
      : await prisma.annualCostSettlement.findMany(query);

  return rows.map((row) => ({
    periodFrom: dateToIso(row.periodFrom),
    periodTo: dateToIso(row.periodTo),
  }));
}
