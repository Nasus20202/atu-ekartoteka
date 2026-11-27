import { prisma } from '@/lib/platform/database/prisma';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';
import {
  toAnnualDto,
  toPeriodDto,
  toReadingDto,
} from '@/lib/settlements/dto/settlement-view-mapper';
import {
  findMeterOptions,
  findMeterReadings,
} from '@/lib/settlements/queries/find-meter-readings';
import { findUtilitySettlement } from '@/lib/settlements/queries/find-utility-settlement';
import type { SettlementScope } from '@/lib/settlements/queries/settlement-scope';
import {
  ALL_READINGS,
  type ReadingsQuery,
} from '@/lib/settlements/rules/readings-query';

export interface SettlementSelection {
  utilityId?: string;
  annualId?: string;
  readings?: ReadingsQuery;
}

const periods = {
  select: { id: true, periodFrom: true, periodTo: true },
  orderBy: [{ periodTo: 'desc' as const }, { periodFrom: 'desc' as const }],
};

/**
 * The periods inside the scope and the selected records, by default the newest.
 * Null when a selected record is not inside the scope.
 */
export async function loadApartmentSettlements(
  scope: SettlementScope,
  { utilityId, annualId, readings: query = ALL_READINGS }: SettlementSelection
): Promise<ApartmentSettlementsDto | null> {
  const [utilityRows, annualRows, readings, readingMeters] = await Promise.all([
    prisma.utilitySettlement.findMany({ where: scope, ...periods }),
    prisma.annualCostSettlement.findMany({ where: scope, ...periods }),
    findMeterReadings(scope, query),
    findMeterOptions(scope),
  ]);
  const selectedUtility = utilityId ?? utilityRows[0]?.id;
  const selectedAnnual = annualId ?? annualRows[0]?.id;

  // The scope is part of both reads, so a foreign identifier finds nothing
  const [utility, annual] = await Promise.all([
    selectedUtility
      ? findUtilitySettlement({ ...scope, id: selectedUtility })
      : null,
    selectedAnnual
      ? prisma.annualCostSettlement.findFirst({
          where: { ...scope, id: selectedAnnual },
          include: { items: { orderBy: { lineNo: 'asc' } } },
        })
      : null,
  ]);
  if ((selectedUtility && !utility) || (selectedAnnual && !annual)) return null;

  return {
    utilityPeriods: utilityRows.map(toPeriodDto),
    utility,
    readings: readings.map(({ settlement, ...reading }) =>
      toReadingDto(
        reading,
        settlement.summaries.map((summary) => summary.code)
      )
    ),
    readingMeters,
    readingsQuery: query,
    annualPeriods: annualRows.map(toPeriodDto),
    annual: annual && toAnnualDto(annual),
  };
}
