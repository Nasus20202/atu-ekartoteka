import { prisma } from '@/lib/platform/database/prisma';
import { dateToIso, isoToDate } from '@/lib/settlements/rules/periods';
import type {
  AnnualContent,
  UtilityContent,
} from '@/lib/settlements/types/record-content';
import type { StoredPeriod } from '@/lib/settlements/types/stored-data';

const where = (
  apartmentId: string,
  { periodFrom, periodTo }: StoredPeriod
) => ({
  apartmentId_periodFrom_periodTo: {
    apartmentId,
    periodFrom: isoToDate(periodFrom),
    periodTo: isoToDate(periodTo),
  },
});

const days = <T extends { periodFrom: Date; periodTo: Date }>(row: T) => ({
  ...row,
  periodFrom: dateToIso(row.periodFrom),
  periodTo: dateToIso(row.periodTo),
});

export async function findStoredUtilityContent(
  apartmentId: string,
  period: StoredPeriod
): Promise<UtilityContent | null> {
  const row = await prisma.utilitySettlement.findUnique({
    where: where(apartmentId, period),
    include: { lines: true, summaries: true, readings: true },
  });
  if (!row) return null;

  return {
    ...days(row),
    lines: row.lines.map((line) => ({
      ...line,
      dateFrom: dateToIso(line.dateFrom),
      dateTo: dateToIso(line.dateTo),
    })),
    readings: row.readings.map((reading) => ({
      ...reading,
      startDate: dateToIso(reading.startDate),
      endDate: dateToIso(reading.endDate),
    })),
  };
}

export async function findStoredAnnualContent(
  apartmentId: string,
  period: StoredPeriod
): Promise<AnnualContent | null> {
  const row = await prisma.annualCostSettlement.findUnique({
    where: where(apartmentId, period),
    include: { items: true },
  });
  if (!row) return null;

  return { ...days(row), items: row.items.map(days) };
}
