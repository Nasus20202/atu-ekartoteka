import { describe, expect, it, vi } from 'vitest';

import { validateBalanceDrift } from '@/lib/import/balance-drift-validation';
import type { ImportWarning } from '@/lib/import/types';

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const apartmentMap = new Map([['W001#APT001', 'apt-1']]);

function makeEntry(openingBalance: number) {
  return {
    externalId: 'W001',
    apartmentCode: 'APT001',
    year: 2025,
    openingBalance,
  };
}

function makePrevious(openingBalance: number, januaryPayments = 0) {
  return {
    apartmentId: 'apt-1',
    year: 2024,
    openingBalance,
    ...Object.fromEntries(MONTHS.map((month) => [`${month}Payments`, 0])),
    januaryPayments,
  };
}

function makeTx(previous: unknown[], chargeSums: unknown[] = []) {
  return {
    payment: { findMany: vi.fn().mockResolvedValue(previous) },
    charge: { groupBy: vi.fn().mockResolvedValue(chargeSums) },
  };
}

const charge = (period: string, totalAmount: number) => ({
  apartmentId: 'apt-1',
  period,
  _sum: { totalAmount },
});

describe('validateBalanceDrift', () => {
  it('warns when the opening balance differs from the derived closing balance', async () => {
    const tx = makeTx([makePrevious(100, 50)], [charge('202401', 120)]);
    const warnings: ImportWarning[] = [];

    await validateBalanceDrift(tx, apartmentMap, [makeEntry(100)], warnings);

    expect(warnings).toHaveLength(1);
    expect(warnings[0].apartmentExternalId).toBe('APT001');
    expect(warnings[0].difference).toBe('70.0000');
    expect(warnings[0].message).toContain('saldo otwarcia 100.00');
    expect(warnings[0].message).toContain('wyliczone z naliczeń 30.00');
  });

  it('stays silent when the balances match', async () => {
    const tx = makeTx([makePrevious(100, 50)], [charge('202401', 120)]);
    const warnings: ImportWarning[] = [];

    await validateBalanceDrift(tx, apartmentMap, [makeEntry(30)], warnings);

    expect(warnings).toEqual([]);
  });

  it('reads charges through the transaction and only complete previous years', async () => {
    const tx = makeTx([makePrevious(0)]);

    await validateBalanceDrift(tx, apartmentMap, [makeEntry(0)], []);

    const where = tx.payment.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(1);
    expect(where.OR[0]).toMatchObject({ apartmentId: 'apt-1', year: 2024 });
    expect(where.OR[0].dateTo.gte).toBeInstanceOf(Date);
    expect(tx.charge.groupBy).toHaveBeenCalled();
  });

  it('skips apartments without a complete previous year', async () => {
    const tx = makeTx([]);
    const warnings: ImportWarning[] = [];

    await validateBalanceDrift(tx, apartmentMap, [makeEntry(999)], warnings);

    expect(warnings).toEqual([]);
    expect(tx.charge.groupBy).not.toHaveBeenCalled();
  });

  it('warns once per drifting apartment', async () => {
    const map = new Map([
      ['W001#APT001', 'apt-1'],
      ['W002#APT002', 'apt-2'],
    ]);
    const tx = makeTx([
      makePrevious(0),
      { ...makePrevious(0), apartmentId: 'apt-2' },
    ]);
    const warnings: ImportWarning[] = [];

    await validateBalanceDrift(
      tx,
      map,
      [
        makeEntry(10),
        { ...makeEntry(20), externalId: 'W002', apartmentCode: 'APT002' },
      ],
      warnings
    );

    expect(warnings.map((w) => w.apartmentExternalId)).toEqual([
      'APT001',
      'APT002',
    ]);
  });

  it('ignores entries without a matching apartment', async () => {
    const tx = makeTx([]);

    await validateBalanceDrift(tx, new Map(), [makeEntry(1)], []);

    expect(tx.payment.findMany).not.toHaveBeenCalled();
  });
});
