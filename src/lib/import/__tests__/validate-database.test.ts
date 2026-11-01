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
      'różnica równa wyrównaniom'
    );
  });

  it('reports a stored closing balance that breaks the identity check as an error', async () => {
    mocks.chargeFindMany.mockResolvedValue([storedCharge('202501', 500)]);
    mocks.paymentFindMany.mockResolvedValue([storedPayment(500, 123)]);

    const result = await validateDatabase();

    expect(result.success).toBe(false);
    expect(result.results[0].errors).toHaveLength(1);
  });

  it('never writes to the database', async () => {
    mocks.chargeFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([]);

    await validateDatabase();

    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(mocks.chargeDeleteMany).not.toHaveBeenCalled();
  });
});
