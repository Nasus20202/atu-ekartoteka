/** Database rows of the sample settlements, as the read queries return them. */

import type { FixtureAnnualPage } from '@/__tests__/helpers/settlement-pdf/annual-page';
import {
  parsedAnnualRecord,
  parsedUtilityRecord,
} from '@/__tests__/helpers/settlement-pdf/parsed-records';
import type { FixtureUtilityPage } from '@/__tests__/helpers/settlement-pdf/utility-page';
import {
  annualData,
  utilityData,
} from '@/lib/settlements/mutations/settlement-data';
import { toDecimal } from '@/lib/shared/utils/decimal';

const stored = (id: string) => ({
  id,
  apartmentId: 'a1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const children = <T extends object>(settlementId: string, rows: T[]) =>
  rows.map((row, index) => ({
    ...row,
    id: `${settlementId}-${index}`,
    settlementId,
  }));

export function storedUtilityRow(page?: FixtureUtilityPage, id = 'u1') {
  const data = utilityData(parsedUtilityRecord(page), 'media.pdf');
  return {
    ...stored(id),
    ...data.header,
    lines: children(`${id}-line`, data.lines),
    readings: children(`${id}-meter`, data.readings),
    summaries: children(`${id}-sum`, data.summaries),
  };
}

export function storedAnnualRow(page?: FixtureAnnualPage, id = 'r1') {
  const data = annualData(parsedAnnualRecord(page), 'roczne.pdf');
  return {
    ...stored(id),
    ...data.header,
    items: children(`${id}-item`, data.items),
  };
}

type UtilityRow = ReturnType<typeof storedUtilityRow>;

/** What the database adds up for one settlement. */
export const codeSumsOf = (row: UtilityRow) =>
  row.summaries.map((summary) => ({
    code: summary.code,
    consumption: summary.consumption,
    advanceQuantity: summary.advanceQuantity,
    difference: summary.difference,
    amount: summary.amount,
  }));

export const kindSumOf = (row: UtilityRow, kind: 'ADVANCE' | 'CONSUMPTION') =>
  row.lines
    .filter((line) => line.kind === kind)
    .reduce((sum, line) => sum.plus(line.amount), toDecimal(0));
