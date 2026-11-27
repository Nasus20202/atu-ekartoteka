import {
  annualPage,
  type FixtureAnnualPage,
} from '@/__tests__/helpers/settlement-pdf/annual-page';
import { fixtureRows } from '@/__tests__/helpers/settlement-pdf/fixture-page';
import {
  type FixtureUtilityPage,
  utilityPage,
} from '@/__tests__/helpers/settlement-pdf/utility-page';
import { parseAnnualRows } from '@/lib/settlements/parsers/parse-annual-rows';
import { parseUtilityRows } from '@/lib/settlements/parsers/parse-utility-rows';
import type { ChargeRow } from '@/lib/settlements/types/stored-data';
import { toDecimal } from '@/lib/shared/utils/decimal';

export const parsedUtilityRecord = (page?: FixtureUtilityPage) =>
  parseUtilityRows(fixtureRows([utilityPage(page)])).records[0];

export const parsedAnnualRecord = (page?: FixtureAnnualPage) =>
  parseAnnualRows(fixtureRows([annualPage(page).filter((r) => r.size !== 7)]))
    .records[0];

export const chargeRow = (
  period: string,
  description: string,
  quantity: string,
  unitPrice: string,
  totalAmount: string
): ChargeRow => ({
  period,
  description,
  quantity: toDecimal(quantity),
  unitPrice: toDecimal(unitPrice),
  totalAmount: toDecimal(totalAmount),
});

/** Monthly charges that agree with the default utility page. */
export const UTILITY_PAGE_CHARGES: ChargeRow[] = [
  ...['202205', '202206', '202207', '202208', '202209'].map((period) =>
    chargeRow(period, 'Zaliczka CW', '3', '32', '96')
  ),
  chargeRow('202209', 'Wyrównanie zaliczek CW', '-4.7', '32', '-150.4'),
];
