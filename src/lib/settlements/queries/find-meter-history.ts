import { prisma } from '@/lib/platform/database/prisma';
import { replacedWhere } from '@/lib/settlements/queries/replaced-where';
import { dateToIso, isoToDate } from '@/lib/settlements/rules/periods';
import type {
  ReplacedPeriods,
  StoredPeriod,
  StoredReading,
} from '@/lib/settlements/types/stored-data';
import type { MeterRow } from '@/lib/settlements/types/utility-settlement';

/**
 * Stored readings that the new ones must agree with: those of the same meter
 * that meet them on a date, and those stored for another apartment. The record
 * being replaced is left out, as are those a clean import removes.
 */
export async function findMeterHistory(
  readings: MeterRow[],
  apartment: { id: string; externalApartmentId: string },
  { periodFrom, periodTo }: StoredPeriod,
  replaced: ReplacedPeriods[] = []
): Promise<StoredReading[]> {
  if (readings.length === 0) return [];

  const rows = await prisma.meterReading.findMany({
    where: {
      NOT: [
        {
          settlement: {
            apartmentId: apartment.id,
            periodFrom: isoToDate(periodFrom),
            periodTo: isoToDate(periodTo),
          },
        },
        ...replaced
          .filter((scope) => scope.type === 'utility')
          .map((scope) => ({ settlement: replacedWhere(scope) })),
      ],
      OR: readings.flatMap(({ serialNumber, startDate, endDate }) => [
        { serialNumber, endDate: isoToDate(startDate) },
        { serialNumber, startDate: isoToDate(endDate) },
        {
          serialNumber,
          settlement: {
            apartment: {
              externalApartmentId: { not: apartment.externalApartmentId },
            },
          },
        },
      ]),
    },
    select: {
      serialNumber: true,
      startDate: true,
      startValue: true,
      endDate: true,
      endValue: true,
      settlement: {
        select: { apartment: { select: { externalApartmentId: true } } },
      },
    },
    orderBy: [{ serialNumber: 'asc' }, { endDate: 'asc' }],
  });

  return rows.map(({ settlement, startDate, endDate, ...reading }) => ({
    ...reading,
    startDate: dateToIso(startDate),
    endDate: dateToIso(endDate),
    externalApartmentId: settlement.apartment.externalApartmentId,
  }));
}
