/** What the settlement views receive for the sample settlements. */

import type { FixtureAnnualPage } from '@/__tests__/helpers/settlement-pdf/annual-page';
import {
  codeSumsOf,
  kindSumOf,
  storedAnnualRow,
  storedUtilityRow,
} from '@/__tests__/helpers/settlement-pdf/stored-rows';
import type { FixtureUtilityPage } from '@/__tests__/helpers/settlement-pdf/utility-page';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';
import {
  toAnnualDto,
  toPeriodDto,
  toUtilityDto,
} from '@/lib/settlements/dto/settlement-view-mapper';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

export function utilityDto(page?: FixtureUtilityPage, id = 'u1') {
  const row = storedUtilityRow(page, id);
  return toUtilityDto(row, codeSumsOf(row), {
    advanceAmount: kindSumOf(row, 'ADVANCE'),
    consumptionAmount: kindSumOf(row, 'CONSUMPTION'),
  });
}

export const annualDto = (page?: FixtureAnnualPage, id = 'r1') =>
  toAnnualDto(storedAnnualRow(page, id));

export function settlementsDto(
  overrides: Partial<ApartmentSettlementsDto> = {}
): ApartmentSettlementsDto {
  const utility = utilityDto();
  const readings = [
    ...utility.utilities.flatMap((entry) => entry.meters),
    ...utility.otherMeters,
  ];
  return {
    utilityPeriods: [toPeriodDto(storedUtilityRow())],
    utility,
    readings,
    readingMeters: readings.map(({ device, label }) => ({ device, label })),
    readingsQuery: ALL_READINGS,
    annualPeriods: [toPeriodDto(storedAnnualRow())],
    annual: annualDto(),
    ...overrides,
  };
}
