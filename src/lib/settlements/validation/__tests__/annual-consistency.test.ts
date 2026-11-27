import { describe, expect, it } from 'vitest';

import { annualItem } from '@/__tests__/helpers/settlement-pdf/annual-page';
import { parsedAnnualRecord } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import {
  checkAnnualRecord,
  checkOwnerTotals,
} from '@/lib/settlements/validation/annual-consistency';
import { toDecimal } from '@/lib/shared/utils/decimal';

const context = { fileName: 'a.pdf', subject: 'Lipowa 1' };

const check = (...args: Parameters<typeof parsedAnnualRecord>) =>
  checkAnnualRecord(parsedAnnualRecord(...args), context);

const withItem = (item: Parameters<typeof annualItem>[0], total = '32,00') => ({
  items: [annualItem(item)],
  apartmentTotal: `Nadpłata [lokal]: ${total} zł.`,
});

describe('checkAnnualRecord', () => {
  it('accepts a record that adds up', () => {
    expect(check()).toEqual([]);
  });

  it('accepts an amount 0,01 zł off the formula', () => {
    const item = { result: 'Nadpłata [naliczenie]: 32,01 zł.' };

    expect(check(withItem(item, '32,01'))).toEqual([]);
  });

  it('warns about a rounding adjustment of the amount', () => {
    const item = { result: 'Nadpłata [naliczenie]: 32,02 zł.' };

    expect(check(withItem(item, '32,02'))).toEqual([
      expect.objectContaining({ kind: 'rounding', severity: 'warning' }),
    ]);
  });

  it('warns about a coefficient that does not follow from the bases', () => {
    expect(check(withItem({ coefficient: '0,0401' }))).toEqual([
      expect.objectContaining({
        severity: 'warning',
        message: expect.stringContaining('współczynnik 0,0401'),
      }),
    ]);
  });

  it('warns when the community basis is zero', () => {
    expect(check(withItem({ communityBasis: '0' }))).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('podstawa wspólnoty to 0'),
      }),
    ]);
  });

  it('warns about an apartment total that differs from its items', () => {
    expect(check({ apartmentTotal: 'Nadpłata [lokal]: 33,00 zł.' })).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('suma lokalu'),
      }),
    ]);
  });

  it('refuses an item printed twice', () => {
    const issues = check({
      items: [annualItem(), annualItem()],
      apartmentTotal: 'Nadpłata [lokal]: 64,00 zł.',
    });

    expect(issues).toEqual([
      expect.objectContaining({ severity: 'error', kind: 'inconsistent' }),
    ]);
  });

  it('refuses values that cannot be stored', () => {
    expect(check(withItem({ coefficient: '0,040001' }))).toContainEqual(
      expect.objectContaining({ severity: 'error' })
    );
  });
});

describe('checkOwnerTotals', () => {
  const total = (value: string) => ({
    page: 2,
    printedOwner: 'Kowalska Anna',
    total: toDecimal(value),
    apartmentSum: toDecimal('10'),
  });

  it('allows 0,01 zł and refuses more', () => {
    expect(checkOwnerTotals([total('10.01')], 'a.pdf')).toEqual([]);
    expect(checkOwnerTotals([total('10.02')], 'a.pdf')).toEqual([
      expect.objectContaining({ severity: 'error', page: 2 }),
    ]);
  });
});
