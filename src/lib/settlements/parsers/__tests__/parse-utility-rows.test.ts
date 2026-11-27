import { describe, expect, it } from 'vitest';

import {
  type FixturePage,
  fixtureRows,
  row,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';
import {
  FIXTURE_SERVICES,
  utilityPage,
} from '@/__tests__/helpers/settlement-pdf/utility-page';
import { parseUtilityRows } from '@/lib/settlements/parsers/parse-utility-rows';

const parse = (...pages: FixturePage[]) => parseUtilityRows(fixtureRows(pages));

describe('parseUtilityRows', () => {
  it('stores lines, summary rows, meters and the total as printed', () => {
    const { records, problems } = parse(utilityPage());

    expect(problems).toEqual([]);
    const [record] = records;
    expect(record.issuedOn).toBe('2022-10-03');
    expect(record.totalAmount.toString()).toBe('-150.4');
    expect(record.lines.map((l) => [l.kind, l.description])).toEqual([
      ['ADVANCE', 'Zaliczka CW'],
      ['CONSUMPTION', 'Wyrównanie zaliczek CW'],
    ]);
    expect(record.lines[1]).toMatchObject({
      dateFrom: '2022-05-01',
      dateTo: '2022-09-30',
    });
    expect(record.lines[1].quantity.toString()).toBe('10.3');
    expect(record.summaries[0].code).toBe('CW');
    expect(record.summaries[0].difference.toString()).toBe('-4.7');
    expect(record.readings[0]).toMatchObject({
      device: 'CW 01',
      serialNumber: '7000001',
      label: 'CW 1',
      unit: 'm3',
      startDate: '2022-04-30',
      endDate: '2022-09-30',
    });
  });

  it('stores an amount to pay as positive', () => {
    const { records } = parse(
      utilityPage({ total: 'Razem do zapłaty [lokal]: 12,50' })
    );

    expect(records[0].totalAmount.toString()).toBe('12.5');
  });

  it('keeps a consumption line with no consumption', () => {
    const { records } = parse(
      utilityPage({
        services: [
          {
            name: 'Wyrównanie zaliczek ZW',
            column: 'Do zapłaty',
            lines: ['01/05/2022 30/09/2022 0,000000 12,00 0,00'],
          },
        ],
      })
    );

    expect(records[0].lines[0].kind).toBe('CONSUMPTION');
    expect(records[0].lines[0].quantity.isZero()).toBe(true);
  });

  it('accepts several price periods of one service', () => {
    const { records, problems } = parse(
      utilityPage({
        services: [
          {
            name: 'Zaliczka CW',
            column: 'Zaliczka',
            lines: [
              '01/05/2022 30/06/2022 6,000000 30,00 180,00',
              '01/07/2022 30/09/2022 9,000000 32,00 288,00',
            ],
          },
        ],
      })
    );

    expect(problems).toEqual([]);
    expect(records[0].lines).toHaveLength(2);
  });

  it('ignores the text above the owner and after the total', () => {
    const page = utilityPage();
    page.push(row('Konto: 00 0000 0000 — wpłaty do 10 dnia miesiąca'));

    expect(parse(page).problems).toEqual([]);
  });

  it('rejects an unknown row inside a record, naming page and row', () => {
    const page = utilityPage();
    page.splice(5, 0, row('Opłata dodatkowa 12,00'));

    expect(parse(utilityPage(), page).problems).toEqual([
      {
        kind: 'unrecognised',
        page: 2,
        message: 'Nierozpoznany wiersz: „Opłata dodatkowa 12,00”',
      },
    ]);
  });

  it('rejects an unknown amount column and its lines', () => {
    const { problems } = parse(
      utilityPage({
        services: [{ ...FIXTURE_SERVICES[0], column: 'Rabat' }],
      })
    );

    expect(problems.map((p) => p.message)).toEqual([
      'Nierozpoznany wiersz: „Okres od Okres do Ilość Cena Rabat”',
      expect.stringContaining('15,000000'),
    ]);
  });

  it('rejects a line with a date that does not exist', () => {
    const { problems } = parse(
      utilityPage({
        services: [
          {
            ...FIXTURE_SERVICES[0],
            lines: ['31/02/2022 30/09/2022 1,000000 1,00 1,00'],
          },
        ],
      })
    );

    expect(problems).toHaveLength(1);
  });

  it('rejects a record without a total', () => {
    const page = utilityPage().slice(0, -2);

    expect(parse(page).problems.at(-1)?.message).toContain(
      'Brak sumy rozliczenia'
    );
  });

  it('rejects lines that stand outside any record', () => {
    const { problems } = parse(utilityPage(), [
      row('Usługa:Zaliczka CO'),
      row('01/05/2022 30/09/2022 1,000000 1,00 1,00'),
    ]);

    expect(problems).toHaveLength(2);
    expect(problems[0].message).toContain('Pozycja poza rozliczeniem');
  });

  it('rejects a record without an issue date', () => {
    const page = utilityPage().slice(1);

    expect(parse(page).problems[0].message).toContain('daty wystawienia');
  });

  it('rejects a total of a record without a summary', () => {
    const { records, problems } = parse(utilityPage({ summaries: [] }));

    expect(records).toEqual([]);
    expect(problems[0].message).toContain('Niepełne rozliczenie');
  });
});
