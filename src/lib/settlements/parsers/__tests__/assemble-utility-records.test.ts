import { describe, expect, it } from 'vitest';

import {
  type FixturePage,
  fixtureRows,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';
import {
  FIXTURE_SERVICES,
  utilityPage,
} from '@/__tests__/helpers/settlement-pdf/utility-page';
import { parseUtilityRows } from '@/lib/settlements/parsers/parse-utility-rows';

const parse = (...pages: FixturePage[]) => parseUtilityRows(fixtureRows(pages));

const OTHER = 'Nowak Jan';

// One service per page with partial summary rows, as after an owner change
const advancePage = (owner?: string) =>
  utilityPage({
    owner,
    services: [FIXTURE_SERVICES[0]],
    summaries: ['CW: 0,000000 - 15,000000 = -15,000000 -480,00'],
    total: 'Nadpłata [lokal]: 480,00',
  });
const consumptionPage = (owner?: string) =>
  utilityPage({
    owner,
    issued: '04/10/2022',
    services: [FIXTURE_SERVICES[1]],
    summaries: ['CW: 10,300000 - 0,000000 = 10,300000 329,60'],
    total: 'Razem do zapłaty [lokal]: 329,60',
  });

describe('utility records across pages', () => {
  it('joins alternating pages into one record per owner', () => {
    const { records, problems } = parse(
      advancePage(),
      advancePage(OTHER),
      consumptionPage(),
      consumptionPage(OTHER)
    );

    expect(problems).toEqual([]);
    expect(records.map((r) => r.printedOwner)).toEqual([
      'Kowalska Anna',
      OTHER,
    ]);
    const [record] = records;
    expect(record.lines).toHaveLength(2);
    expect(record.summaries).toHaveLength(2);
    expect(record.totalAmount.toString()).toBe('-150.4');
    expect(record.issuedOn).toBe('2022-10-04');
    expect(record.pageTotals.map((p) => p.page)).toEqual([1, 3]);
  });

  it('keeps a repeated meter row once', () => {
    const { records } = parse(advancePage(), consumptionPage());

    expect(records[0].readings).toHaveLength(1);
  });

  it('keeps conflicting meter rows for the checks to report', () => {
    const { records } = parse(
      advancePage(),
      utilityPage({
        services: [FIXTURE_SERVICES[1]],
        meters: [
          'CW 01 7000001 (CW 1) 30/04/2022 105,500 30/09/2022 116,000 10,500 m3',
        ],
      })
    );

    expect(records[0].readings).toHaveLength(2);
  });

  it('keeps different periods apart', () => {
    const { records } = parse(
      utilityPage(),
      utilityPage({ period: ['01/10/2022', '31/12/2022'] })
    );

    expect(records).toHaveLength(2);
  });
});
