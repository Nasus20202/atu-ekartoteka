import { describe, expect, it } from 'vitest';

import { parsedUtilityRecord } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import { FIXTURE_SERVICES } from '@/__tests__/helpers/settlement-pdf/utility-page';
import { checkUtilityConsistency } from '@/lib/settlements/validation/utility-consistency';
import { checkUtilityWarnings } from '@/lib/settlements/validation/utility-warnings';

const context = { fileName: 'a.pdf', subject: 'Lipowa 1' };

const errors = (...args: Parameters<typeof parsedUtilityRecord>) =>
  checkUtilityConsistency(parsedUtilityRecord(...args), context).map(
    (i) => i.message
  );
const warnings = (...args: Parameters<typeof parsedUtilityRecord>) =>
  checkUtilityWarnings(parsedUtilityRecord(...args), context);

const meter = (consumption: string, unit = 'm3', serial = '7000001') =>
  `CW 01 ${serial} (CW 1) 30/04/2022 105,500 30/09/2022 115,800 ${consumption} ${unit}`;
const summary = (amount: string, difference = '-4,700000') =>
  `CW: 10,300000 - 15,000000 = ${difference} ${amount}`;

describe('checkUtilityConsistency', () => {
  it('accepts a record that adds up', () => {
    expect(errors()).toEqual([]);
    expect(warnings()).toEqual([]);
  });

  it('reports a consumption that is not the difference of the readings', () => {
    expect(errors({ meters: [meter('3,000')] })).toEqual([
      expect.stringContaining('nie jest różnicą odczytów'),
    ]);
  });

  it('reports conflicting rows of one meter', () => {
    expect(
      errors({ meters: [meter('10,300'), meter('10,300', 'GJ')] })
    ).toEqual([expect.stringContaining('sprzeczne wiersze')]);
  });

  it('reports a line printed twice', () => {
    const [advance, consumption] = FIXTURE_SERVICES;

    expect(
      errors({ services: [advance, advance, consumption] })
    ).toContainEqual(expect.stringContaining('występuje dwa razy'));
  });

  it('reports a summary difference that does not follow', () => {
    expect(errors({ summaries: [summary('-150,40', '-4,000000')] })).toEqual([
      expect.stringContaining('CW: różnica -4'),
    ]);
  });

  it('reports line quantities that differ from the summary', () => {
    expect(errors({ services: [FIXTURE_SERVICES[0]] })).toEqual([
      expect.stringContaining('ilość zużycia w pozycjach (0)'),
    ]);
  });

  it('reports a value with more decimals than can be stored', () => {
    const service = {
      ...FIXTURE_SERVICES[0],
      lines: ['01/05/2022 30/09/2022 15,000000 32,000001 480,00'],
    };

    expect(errors({ services: [service, FIXTURE_SERVICES[1]] })).toEqual([
      expect.stringContaining('32,000001'),
    ]);
  });

  it('skips quantity checks when a line has no group', () => {
    const record = {
      services: [{ ...FIXTURE_SERVICES[0], name: 'Abonament' }],
    };

    expect(errors(record)).toEqual([]);
    expect(warnings(record)).toEqual([
      expect.objectContaining({
        kind: 'ungrouped',
        severity: 'warning',
        message: expect.stringContaining('„Abonament”'),
      }),
    ]);
  });
});

describe('checkUtilityWarnings', () => {
  const line = (amount: string) => ({
    services: [
      {
        ...FIXTURE_SERVICES[0],
        lines: [`01/05/2022 30/09/2022 15,000000 32,00 ${amount}`],
      },
      FIXTURE_SERVICES[1],
    ],
  });

  it('accepts a difference of 0,01 zł', () => {
    expect(warnings(line('480,01'))).toEqual([]);
  });

  it('reports a line amount that differs by 0,02 zł', () => {
    // The line and the difference of the lines are both off
    expect(warnings(line('480,02')).map((i) => i.kind)).toEqual([
      'rounding',
      'rounding',
    ]);
  });

  it('reports a total that differs from the summary amounts', () => {
    expect(warnings({ total: 'Nadpłata [lokal]: 150,00' })).toEqual([
      expect.objectContaining({ kind: 'rounding', page: 1 }),
    ]);
  });

  it('reports billed consumption that differs from the meters', () => {
    expect(warnings({ meters: [meter('9,000')] })).toEqual([
      expect.objectContaining({
        kind: 'meter-billed',
        message: expect.stringContaining('10,3'),
      }),
    ]);
  });

  it('reports meters of one utility in different units', () => {
    const second =
      'CW 02 7000002 (CW 2) 30/04/2022 0,000 30/09/2022 0,000 0,000 GJ';

    expect(warnings({ meters: [meter('10,300'), second] })).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('różnych jednostkach'),
      }),
    ]);
  });
});
