import { describe, expect, it } from 'vitest';

import {
  chargeRow,
  parsedUtilityRecord,
  UTILITY_PAGE_CHARGES,
} from '@/__tests__/helpers/settlement-pdf/parsed-records';
import { FIXTURE_SERVICES } from '@/__tests__/helpers/settlement-pdf/utility-page';
import type { ChargeRow } from '@/lib/settlements/types/stored-data';
import { checkUtilityCharges } from '@/lib/settlements/validation/utility-charges';

const context = { fileName: 'a.pdf', subject: 'Lipowa 1' };

const check = (charges: ChargeRow[], record = parsedUtilityRecord()) =>
  checkUtilityCharges(record, charges, context);

const replaceSettlement = (quantity: string, amount: string) => [
  ...UTILITY_PAGE_CHARGES.slice(0, -1),
  chargeRow('202209', 'Wyrównanie zaliczek CW', quantity, '32', amount),
];

describe('checkUtilityCharges', () => {
  it('finds nothing when the charges agree', () => {
    expect(check(UTILITY_PAGE_CHARGES)).toEqual([]);
  });

  it('accepts an amount 0,01 zł off', () => {
    expect(check(replaceSettlement('-4.7', '-150.41'))).toEqual([]);
  });

  it('refuses an amount 0,02 zł off', () => {
    expect(check(replaceSettlement('-4.7', '-150.42'))).toEqual([
      expect.objectContaining({
        severity: 'error',
        kind: 'charges',
        message: expect.stringContaining('CW: kwota rozliczenia'),
      }),
    ]);
  });

  it('refuses another difference quantity, stating both', () => {
    expect(check(replaceSettlement('-4.6', '-150.4'))).toEqual([
      expect.objectContaining({
        message: expect.stringMatching(/w pliku -4,7, w naliczeniach -4,6/),
      }),
    ]);
  });

  it('refuses other advances', () => {
    expect(
      check(
        UTILITY_PAGE_CHARGES.slice(1).concat(
          chargeRow('202205', 'Fundusz remontowy', '1', '10', '10')
        )
      )
    ).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('ilość zaliczek w pliku 15'),
      }),
    ]);
  });

  it('leaves the December allocation and other names out', () => {
    const record = parsedUtilityRecord({
      period: ['01/12/2022', '31/12/2022'],
    });
    const charges = [
      chargeRow('202212', 'Zaliczka CW', '15', '32', '480'),
      chargeRow('202212', 'Wyrównanie zaliczek CW', '-4.7', '32', '-150.4'),
      chargeRow('202212', 'Wyrównanie zaliczek CW', '12.34', '1', '12.34'),
      chargeRow('202212', 'ZW - woda bezzwrotna', '2', '5', '10'),
    ];

    expect(check(charges, record)).toEqual([]);
  });

  it('warns instead of checking when a month has no charges', () => {
    expect(check(UTILITY_PAGE_CHARGES.slice(1))).toEqual([
      expect.objectContaining({
        severity: 'warning',
        kind: 'not-verified',
        message: expect.stringContaining('Maj 2022'),
      }),
    ]);
  });

  it('checks nothing when a line has no group', () => {
    const record = parsedUtilityRecord({
      services: [{ ...FIXTURE_SERVICES[0], name: 'Abonament' }],
    });

    expect(check([], record)).toEqual([]);
  });
});
