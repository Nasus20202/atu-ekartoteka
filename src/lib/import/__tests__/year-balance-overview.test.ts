import { describe, expect, it } from 'vitest';

import type { ImportWarning } from '@/lib/import/types';
import {
  type BalancePaymentSource,
  buildYearBalanceRows,
} from '@/lib/import/year-balance-overview';
import { withYearStatus } from '@/lib/import/year-status';
import type { MonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import { toDecimal } from '@/lib/utils/decimal';
import { PAYMENT_MONTH_FIELD_KEYS } from '@/lib/utils/payment-months';

const [JANUARY_PAYMENTS] = PAYMENT_MONTH_FIELD_KEYS;

const NO_CHARGES: MonthlyChargeSums = new Map();

function payment(
  apartmentId: string,
  year: number,
  openingBalance: number,
  januaryPayments = 0
): BalancePaymentSource {
  const monthly = Object.fromEntries(
    PAYMENT_MONTH_FIELD_KEYS.map((key) => [key, 0])
  ) as Record<(typeof PAYMENT_MONTH_FIELD_KEYS)[number], number>;
  return {
    ...monthly,
    [JANUARY_PAYMENTS]: januaryPayments,
    apartmentId,
    apartmentLabel: apartmentId,
    ownerId: `owner-${apartmentId}`,
    year,
    openingBalance,
  };
}

describe('buildYearBalanceRows', () => {
  it('sums the opening and closing balances of all apartments per year', () => {
    const rows = buildYearBalanceRows(
      [payment('apt-1', 2025, 100), payment('apt-2', 2025, 50)],
      NO_CHARGES
    );

    expect(rows).toMatchObject([
      {
        year: 2025,
        openingBalance: '150.00',
        calculatedClosing: '150.00',
        closingMismatch: false,
      },
    ]);
  });

  it('derives the closing balance from payments minus charge records', () => {
    const charges: MonthlyChargeSums = new Map([
      ['apt-1', new Map([['202501', toDecimal(100)]])],
    ]);

    const rows = buildYearBalanceRows(
      [payment('apt-1', 2025, 0, 300)],
      charges
    );

    expect(rows[0]).toMatchObject({
      openingBalance: '0.00',
      calculatedClosing: '200.00',
    });
  });

  it('returns no rows for an HOA without payments', () => {
    expect(buildYearBalanceRows([], NO_CHARGES)).toEqual([]);
  });

  it('marks a closing balance that differs from the next year opening', () => {
    const rows = buildYearBalanceRows(
      [payment('apt-1', 2024, 100), payment('apt-1', 2025, 150)],
      NO_CHARGES
    );

    expect(
      rows.map(({ year, closingMismatch }) => [year, closingMismatch])
    ).toEqual([
      [2024, true],
      [2025, false],
    ]);
  });

  it('does not mark a closing balance that matches the next year opening', () => {
    const rows = buildYearBalanceRows(
      [payment('apt-1', 2024, 100), payment('apt-1', 2025, 100)],
      NO_CHARGES
    );

    expect(rows[0].closingMismatch).toBe(false);
  });

  it('does not mark a difference equal to the tolerance', () => {
    const rows = buildYearBalanceRows(
      [payment('apt-1', 2024, 100), payment('apt-1', 2025, 100.01)],
      NO_CHARGES
    );

    expect(rows[0].closingMismatch).toBe(false);
  });

  it('compares a year with the next stored year when a year is missing', () => {
    const rows = buildYearBalanceRows(
      [payment('apt-1', 2024, 100), payment('apt-1', 2026, 250)],
      NO_CHARGES
    );

    expect(
      rows.map(({ year, closingMismatch }) => [year, closingMismatch])
    ).toEqual([
      [2024, true],
      [2026, false],
    ]);
  });

  it('does not mark a year when the next year has an extra apartment', () => {
    const rows = buildYearBalanceRows(
      [
        payment('apt-1', 2025, 100),
        payment('apt-1', 2026, 100),
        payment('apt-2', 2026, 500),
      ],
      NO_CHARGES
    );

    expect(
      rows.map(({ year, closingMismatch }) => [year, closingMismatch])
    ).toEqual([
      [2025, false],
      [2026, false],
    ]);
  });

  it('marks a year when the apartments present in both years differ', () => {
    const rows = buildYearBalanceRows(
      [
        payment('apt-1', 2025, 100),
        payment('apt-1', 2026, 150),
        payment('apt-2', 2026, 500),
      ],
      NO_CHARGES
    );

    expect(rows[0].closingMismatch).toBe(true);
  });

  it('lists each apartment record with its status and the next opening', () => {
    const rows = buildYearBalanceRows(
      [
        payment('apt-1', 2025, 100),
        payment('apt-1', 2026, 250),
        payment('apt-2', 2025, 50),
      ],
      NO_CHARGES
    );

    expect(rows[0].records).toMatchObject([
      { apartmentLabel: 'apt-1', status: 'mismatch', difference: '-150.00' },
      { apartmentLabel: 'apt-2', status: 'ended', nextOpening: null },
    ]);
    expect(rows[1].records).toMatchObject([
      { apartmentLabel: 'apt-1', status: 'last', isNew: false },
    ]);
  });

  it('reports the opening of a new owner record as new', () => {
    const rows = buildYearBalanceRows(
      [
        payment('apt-1', 2025, 100),
        payment('apt-1', 2026, 100),
        payment('apt-2', 2026, 1182.77),
      ],
      NO_CHARGES
    );

    expect(rows[0].newRecordsOpening).toBe('0.00');
    expect(rows[1].newRecordsOpening).toBe('1182.77');
    expect(
      rows[1].records.find(({ apartmentLabel }) => apartmentLabel === 'apt-2')
    ).toMatchObject({
      isNew: true,
      status: 'last',
    });
  });

  it('never marks the last stored year', () => {
    const rows = buildYearBalanceRows(
      [payment('apt-1', 2025, 999)],
      NO_CHARGES
    );

    expect(rows[0].closingMismatch).toBe(false);
  });
});

function warning(fields: Partial<ImportWarning>): ImportWarning {
  return {
    kind: 'charges-mismatch',
    apartmentExternalId: 'apt-1',
    message: 'uwaga',
    ...fields,
  };
}

describe('withYearStatus', () => {
  const summaries = [
    {
      year: 2024,
      openingBalance: '100.00',
      calculatedClosing: '100.00',
      closingMismatch: false,
      records: [],
      newRecordsOpening: '0.00',
    },
    {
      year: 2025,
      openingBalance: '100.00',
      calculatedClosing: '100.00',
      closingMismatch: false,
      records: [],
      newRecordsOpening: '0.00',
    },
  ];

  it('marks every year ok when there are no issues', () => {
    const rows = withYearStatus(summaries, [], []);

    expect(rows.map(({ status, issueCount }) => [status, issueCount])).toEqual([
      ['ok', 0],
      ['ok', 0],
    ]);
  });

  it('marks only the year of a warning', () => {
    const rows = withYearStatus(summaries, [], [warning({ year: 2025 })]);

    expect(rows.map(({ status }) => status)).toEqual(['ok', 'warning']);
    expect(rows[1].issueCount).toBe(1);
  });

  it('uses the year of the charge period for a warning', () => {
    const rows = withYearStatus(summaries, [], [warning({ period: '202412' })]);

    expect(rows.map(({ status }) => status)).toEqual(['warning', 'ok']);
  });

  it('applies a warning without a year to every year', () => {
    const rows = withYearStatus(summaries, [], [warning({})]);

    expect(rows.map(({ status }) => status)).toEqual(['warning', 'warning']);
  });

  it('marks both years of a closing mismatch', () => {
    const mismatch = [
      { ...summaries[0], closingMismatch: true },
      summaries[1],
      { ...summaries[1], year: 2026 },
    ];

    const rows = withYearStatus(mismatch, [], []);

    expect(rows.map(({ status }) => status)).toEqual([
      'warning',
      'warning',
      'ok',
    ]);
  });

  it('marks every year as error when the HOA has errors', () => {
    const rows = withYearStatus(
      summaries,
      [{ kind: 'balance-mismatch', message: 'błąd' }],
      []
    );

    expect(rows.map(({ status }) => status)).toEqual(['error', 'error']);
  });

  it('marks only the year of an error that names a year', () => {
    const rows = withYearStatus(
      summaries,
      [{ kind: 'balance-mismatch', message: 'błąd 2025', year: 2025 }],
      []
    );

    expect(rows.map(({ status }) => status)).toEqual(['ok', 'error']);
  });
});
