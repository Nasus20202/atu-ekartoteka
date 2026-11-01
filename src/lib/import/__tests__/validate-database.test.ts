import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hoaFindMany: vi.fn(),
  chargeFindMany: vi.fn(),
  paymentFindMany: vi.fn(),
  paymentFindFirst: vi.fn().mockResolvedValue(null),
  apartmentFindMany: vi.fn(),
  chargeGroupBy: vi.fn(),
  paymentCreate: vi.fn(),
  chargeDeleteMany: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    homeownersAssociation: { findMany: mocks.hoaFindMany },
    charge: {
      findMany: mocks.chargeFindMany,
      groupBy: mocks.chargeGroupBy,
      deleteMany: mocks.chargeDeleteMany,
    },
    payment: {
      findMany: mocks.paymentFindMany,
      findFirst: mocks.paymentFindFirst,
      create: mocks.paymentCreate,
    },
    apartment: { findMany: mocks.apartmentFindMany },
  },
}));

import { IMPORT_HOA_CONCURRENCY } from '@/lib/import/constants';
import { validateDatabase } from '@/lib/import/validate-database';

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

const apartment = { externalOwnerId: 'W001', externalApartmentId: 'APT001' };

function storedCharge(
  period: string,
  totalAmount: number,
  description = 'Czynsz'
) {
  return {
    apartment,
    dateFrom: new Date(2025, 0, 1),
    dateTo: new Date(2025, 0, 31),
    period,
    externalLineNo: 1,
    description,
    quantity: 1,
    unit: 'szt',
    unitPrice: totalAmount,
    totalAmount,
  };
}

function storedPayment(
  legacyJanuaryCharges: number,
  legacyClosingBalance: number
) {
  return {
    apartment,
    apartmentId: 'apt-1',
    year: 2025,
    dateFrom: new Date(2025, 0, 1),
    dateTo: new Date(2025, 11, 31),
    openingDebt: 0,
    openingSurplus: 0,
    openingBalance: 0,
    legacyClosingBalance,
    ...Object.fromEntries(MONTHS.map((month) => [`${month}Payments`, 0])),
    ...Object.fromEntries(
      MONTHS.map((month) => [
        `legacy${month[0].toUpperCase()}${month.slice(1)}Charges`,
        0,
      ])
    ),
    legacyJanuaryCharges,
  };
}

describe('validateDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hoaFindMany.mockResolvedValue([{ id: 'hoa-1', externalId: 'KLO11' }]);
    mocks.apartmentFindMany.mockResolvedValue([{ id: 'apt-1', ...apartment }]);
    mocks.chargeGroupBy.mockResolvedValue([]);
  });

  it('reports a clean database without errors or warnings', async () => {
    mocks.chargeFindMany.mockResolvedValue([storedCharge('202501', 500)]);
    mocks.paymentFindMany.mockResolvedValue([storedPayment(500, -500)]);

    const result = await validateDatabase();

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      hoaId: 'KLO11',
      errors: [],
      warnings: [],
    });
  });

  it('warns when the stored monthly charge differs from the charge records', async () => {
    mocks.chargeFindMany.mockResolvedValue([
      storedCharge('202501', 500),
      storedCharge('202501', -80, 'Wyrównanie zaliczek CW'),
    ]);
    mocks.paymentFindMany.mockResolvedValue([storedPayment(500, -500)]);

    const result = await validateDatabase();

    expect(result.success).toBe(true);
    expect(result.results[0].warnings).toHaveLength(1);
    expect(result.results[0].warnings[0].message).toContain(
      'różnica -80.00 równa wyrównaniom'
    );
  });

  it('reports a stored closing balance that breaks the identity check as an error', async () => {
    mocks.chargeFindMany.mockResolvedValue([storedCharge('202501', 500)]);
    mocks.paymentFindMany.mockResolvedValue([storedPayment(500, 123)]);

    const result = await validateDatabase();

    expect(result.success).toBe(false);
    expect(result.results[0].errors).toHaveLength(1);
  });

  it('validates every HOA and keeps the HOA order', async () => {
    mocks.hoaFindMany.mockResolvedValue([
      { id: 'hoa-1', externalId: 'KLO11' },
      { id: 'hoa-2', externalId: 'ZEU19' },
    ]);
    mocks.chargeFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([]);

    const result = await validateDatabase();

    expect(result.results.map(({ hoaId }) => hoaId)).toEqual([
      'KLO11',
      'ZEU19',
    ]);
    expect(mocks.chargeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { apartment: { homeownersAssociationId: 'hoa-2' } },
      })
    );
  });

  it('returns the year balance rows with the mismatch flag set', async () => {
    mocks.chargeFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([
      { ...storedPayment(0, 100), year: 2024, openingBalance: 100 },
      { ...storedPayment(0, 250), year: 2025, openingBalance: 250 },
    ]);

    const result = await validateDatabase();

    expect(result.results[0].yearBalances).toMatchObject([
      {
        year: 2024,
        openingBalance: '100.00',
        calculatedClosing: '100.00',
        closingMismatch: true,
        issueCount: 1,
        status: 'warning',
      },
      {
        year: 2025,
        openingBalance: '250.00',
        calculatedClosing: '250.00',
        closingMismatch: false,
        issueCount: 2,
        status: 'warning',
      },
    ]);
  });

  it('skips the file checks and the drift checks but keeps the year balances', async () => {
    mocks.paymentFindMany.mockResolvedValue([
      { ...storedPayment(0, 100), year: 2024, openingBalance: 100 },
      { ...storedPayment(0, 250), year: 2025, openingBalance: 250 },
    ]);

    const result = await validateDatabase({ skipFullValidation: true });

    expect(result.fullValidationSkipped).toBe(true);
    expect(mocks.chargeFindMany).not.toHaveBeenCalled();
    expect(mocks.apartmentFindMany).not.toHaveBeenCalled();
    expect(result.results[0].warnings).toEqual([]);
    expect(result.results[0].yearBalances).toMatchObject([
      { year: 2024, closingMismatch: true, status: 'warning' },
      { year: 2025, closingMismatch: false, status: 'warning' },
    ]);
  });

  it('marks only the year whose payment identity fails as an error', async () => {
    mocks.chargeFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([
      { ...storedPayment(0, 0), year: 2024, openingBalance: 0 },
      { ...storedPayment(0, 250), year: 2025, openingBalance: 0 },
    ]);

    const result = await validateDatabase();

    expect(result.results[0].errors).toHaveLength(1);
    expect(result.results[0].errors[0].year).toBe(2025);
    expect(
      result.results[0].yearBalances?.map(({ year, status }) => [year, status])
    ).toEqual([
      [2024, 'ok'],
      [2025, 'error'],
    ]);
  });

  it('validates at most IMPORT_HOA_CONCURRENCY HOAs at once', async () => {
    mocks.hoaFindMany.mockResolvedValue([
      { id: 'hoa-1', externalId: 'AAA1' },
      { id: 'hoa-2', externalId: 'BBB2' },
      { id: 'hoa-3', externalId: 'CCC3' },
    ]);
    let running = 0;
    let maxRunning = 0;
    mocks.chargeFindMany.mockImplementation(async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 0));
      running -= 1;
      return [];
    });
    mocks.paymentFindMany.mockResolvedValue([]);

    const result = await validateDatabase();

    expect(maxRunning).toBe(IMPORT_HOA_CONCURRENCY);
    expect(result.results.map(({ hoaId }) => hoaId)).toEqual([
      'AAA1',
      'BBB2',
      'CCC3',
    ]);
    mocks.chargeFindMany.mockResolvedValue([]);
  });

  it('never writes to the database', async () => {
    mocks.chargeFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([]);

    await validateDatabase();

    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(mocks.chargeDeleteMany).not.toHaveBeenCalled();
  });
});
