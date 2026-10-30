import { describe, expect, it, vi } from 'vitest';

import { validateCrossYearBalances } from '@/lib/import/cross-year-validation';

const FULL_YEAR_END = new Date(2023, 11, 31);
const PARTIAL_YEAR_END = new Date(2023, 8, 30);
// Local midnight of 31 December stored with a negative UTC offset applied
const SHIFTED_YEAR_END = new Date(2023, 11, 30, 22);

type PrevPayment = { closingBalance: number; dateTo: Date } | null;

function makeTx(prevPayments: PrevPayment[]) {
  const findFirst = vi.fn();
  prevPayments.forEach((p) => findFirst.mockResolvedValueOnce(p));
  return { payment: { findFirst } };
}

function makeEntry(apartmentCode: string, openingBalance: number) {
  return { externalId: 'W001', apartmentCode, year: 2024, openingBalance };
}

const apartmentMap = new Map([
  ['W001#APT001', 'apt-1'],
  ['W001#APT002', 'apt-2'],
]);

describe('validateCrossYearBalances', () => {
  it('aborts on a mismatch against a complete previous year', async () => {
    const tx = makeTx([{ closingBalance: 50, dateTo: FULL_YEAR_END }]);
    const errors: string[] = [];

    await expect(
      validateCrossYearBalances(
        tx,
        apartmentMap,
        [makeEntry('APT001', 100)],
        errors
      )
    ).rejects.toThrow('1 lokal(e)');

    expect(errors).toEqual([
      'Lokal APT001, rok 2024: saldo otwarcia 100 ≠ saldo zamknięcia 50 roku 2023',
    ]);
    expect(tx.payment.findFirst).toHaveBeenCalledWith({
      where: { apartmentId: 'apt-1', year: 2023 },
      select: { closingBalance: true, dateTo: true },
    });
  });

  it('passes when balances match a complete previous year', async () => {
    const tx = makeTx([{ closingBalance: 100, dateTo: FULL_YEAR_END }]);
    const errors: string[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      errors
    );

    expect(errors).toHaveLength(0);
  });

  it('skips a previous year that ends before 31 December', async () => {
    const tx = makeTx([{ closingBalance: 50, dateTo: PARTIAL_YEAR_END }]);
    const errors: string[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      errors
    );

    expect(errors).toHaveLength(0);
  });

  it('skips when no previous year is stored', async () => {
    const tx = makeTx([null]);
    const errors: string[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      errors
    );

    expect(errors).toHaveLength(0);
  });

  it('treats a timezone-shifted year end as complete', async () => {
    const tx = makeTx([{ closingBalance: 50, dateTo: SHIFTED_YEAR_END }]);
    const errors: string[] = [];

    await expect(
      validateCrossYearBalances(
        tx,
        apartmentMap,
        [makeEntry('APT001', 100)],
        errors
      )
    ).rejects.toThrow();
    expect(errors).toHaveLength(1);
  });

  it('reports every mismatching apartment before aborting', async () => {
    const tx = makeTx([
      { closingBalance: 50, dateTo: FULL_YEAR_END },
      { closingBalance: 70, dateTo: FULL_YEAR_END },
    ]);
    const errors: string[] = [];

    await expect(
      validateCrossYearBalances(
        tx,
        apartmentMap,
        [makeEntry('APT001', 100), makeEntry('APT002', 200)],
        errors
      )
    ).rejects.toThrow('2 lokal(e)');

    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('Lokal APT001');
    expect(errors[1]).toContain('Lokal APT002');
  });
});
