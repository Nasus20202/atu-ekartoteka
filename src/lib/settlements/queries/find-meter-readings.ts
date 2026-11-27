import { prisma } from '@/lib/platform/database/prisma';
import type { SettlementScope } from '@/lib/settlements/queries/settlement-scope';
import type { ReadingsQuery } from '@/lib/settlements/rules/readings-query';

// Breaks ties, so equal values keep the newest readings first
const TIE_BREAK = [
  { endDate: 'desc' as const },
  { device: 'asc' as const },
  { id: 'asc' as const },
];

/** Readings of the scope's settlements, narrowed and ordered by the database. */
export function findMeterReadings(
  scope: SettlementScope,
  { meter, sort }: ReadingsQuery
) {
  return prisma.meterReading.findMany({
    where: { settlement: scope, ...(meter && { device: meter }) },
    include: {
      settlement: { select: { summaries: { select: { code: true } } } },
    },
    orderBy: [{ [sort.key]: sort.direction }, ...TIE_BREAK],
  });
}

/** Every meter that has a reading in the scope, for the filter of the table. */
export async function findMeterOptions(scope: SettlementScope) {
  const meters = await prisma.meterReading.groupBy({
    by: ['device'],
    where: { settlement: scope },
    _max: { label: true },
    orderBy: { device: 'asc' },
  });

  return meters.map(({ device, _max }) => ({
    device,
    label: _max.label ?? device,
  }));
}
