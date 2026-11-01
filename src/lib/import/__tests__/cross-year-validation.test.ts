import { describe, expect, it, vi } from 'vitest';

import { CLOSING_BALANCE_IGNORED_NOTE } from '@/lib/import/constants';
import { validateCrossYearBalances } from '@/lib/import/cross-year-validation';
import type { ImportWarning } from '@/lib/import/types';

const FULL_YEAR_END = new Date(2023, 11, 31);
const PARTIAL_YEAR_END = new Date(2023, 8, 30);
// Local midnight of 31 December stored with a negative UTC offset applied
const SHIFTED_YEAR_END = new Date(2023, 11, 30, 22);

type PrevPayment = { legacyClosingBalance: number; dateTo: Date } | null;

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
  it('warns on a mismatch against a complete previous year without aborting', async () => {
    const tx = makeTx([{ legacyClosingBalance: 50, dateTo: FULL_YEAR_END }]);
    const warnings: ImportWarning[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      warnings
    );

    expect(warnings).toEqual([
      {
        apartmentExternalId: 'APT001',
        year: 2024,
        difference: '50.0000',
        message: `Lokal APT001, rok 2024: saldo otwarcia 100 ≠ saldo zamknięcia roku 2023 z pliku 50. ${CLOSING_BALANCE_IGNORED_NOTE}`,
      },
    ]);
    expect(tx.payment.findFirst).toHaveBeenCalledWith({
      where: { apartmentId: 'apt-1', year: 2023 },
      select: { legacyClosingBalance: true, dateTo: true },
    });
  });

  it('passes when balances match a complete previous year', async () => {
    const tx = makeTx([{ legacyClosingBalance: 100, dateTo: FULL_YEAR_END }]);
    const warnings: ImportWarning[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      warnings
    );

    expect(warnings).toHaveLength(0);
  });

  it('skips a previous year that ends before 31 December', async () => {
    const tx = makeTx([{ legacyClosingBalance: 50, dateTo: PARTIAL_YEAR_END }]);
    const warnings: ImportWarning[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      warnings
    );

    expect(warnings).toHaveLength(0);
  });

  it('skips when no previous year is stored', async () => {
    const tx = makeTx([null]);
    const warnings: ImportWarning[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      warnings
    );

    expect(warnings).toHaveLength(0);
  });

  it('treats a timezone-shifted year end as complete', async () => {
    const tx = makeTx([{ legacyClosingBalance: 50, dateTo: SHIFTED_YEAR_END }]);
    const warnings: ImportWarning[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100)],
      warnings
    );

    expect(warnings).toHaveLength(1);
  });

  it('reports every mismatching apartment', async () => {
    const tx = makeTx([
      { legacyClosingBalance: 50, dateTo: FULL_YEAR_END },
      { legacyClosingBalance: 70, dateTo: FULL_YEAR_END },
    ]);
    const warnings: ImportWarning[] = [];

    await validateCrossYearBalances(
      tx,
      apartmentMap,
      [makeEntry('APT001', 100), makeEntry('APT002', 200)],
      warnings
    );

    expect(warnings).toHaveLength(2);
    expect(warnings[0].message).toContain('Lokal APT001');
    expect(warnings[1].message).toContain('Lokal APT002');
  });
});
