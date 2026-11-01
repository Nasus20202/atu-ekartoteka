import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPaymentData } from '@/lib/import/importers/payment-data';
import { importPayments } from '@/lib/import/importers/payments';
import {
  EntityStats,
  ImportErrorItem,
  TransactionClient,
} from '@/lib/import/types';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import type { DecimalLike } from '@/lib/utils/decimal';

type PaymentEntryOverrides = Partial<
  Omit<
    PaymentEntry,
    | 'openingDebt'
    | 'openingSurplus'
    | 'openingBalance'
    | 'totalCharges'
    | 'monthlyCharges'
    | 'monthlyPayments'
    | 'closingBalance'
  >
> & {
  openingDebt?: DecimalLike;
  openingSurplus?: DecimalLike;
  openingBalance?: DecimalLike;
  totalCharges?: DecimalLike;
  monthlyCharges?: DecimalLike[];
  monthlyPayments?: DecimalLike[];
  closingBalance?: DecimalLike;
};

function createMockTx() {
  return {
    payment: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as TransactionClient;
}

function createStats(): EntityStats {
  return { total: 0, created: 0, updated: 0, skipped: 0, deleted: 0 };
}

function createPaymentEntry(
  overrides: PaymentEntryOverrides = {}
): PaymentEntry {
  return {
    externalId: 'W001',
    apartmentCode: 'APT001',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingDebt: 0,
    openingSurplus: 0,
    openingBalance: 0,
    totalCharges: 2400,
    closingBalance: -100,
    monthlyPayments: [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    ],
    monthlyCharges: [
      200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
    ],
    ...overrides,
  } as PaymentEntry;
}

describe('importPayments', () => {
  let mockTx: ReturnType<typeof createMockTx>;
  let stats: EntityStats;
  let errors: ImportErrorItem[];
  let apartmentMap: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    stats = createStats();
    errors = [];
    apartmentMap = new Map([['W001#APT001', 'apt-1']]);
  });

  it('should map payment entry month values to named payment fields', () => {
    const data = buildPaymentData(createPaymentEntry(), 'apt-1');

    expect(data).toMatchObject({
      apartmentId: 'apt-1',
      januaryPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyDecemberCharges: 200,
    });
  });

  it('should store the monthly charges and closing balance from the file in the legacy fields', () => {
    const data = buildPaymentData(
      createPaymentEntry({ closingBalance: -321 }),
      'apt-1'
    );

    expect(data).toMatchObject({
      legacyClosingBalance: -321,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyDecemberCharges: 200,
    });
    expect(data).not.toHaveProperty('closingBalance');
    expect(data).not.toHaveProperty('januaryCharges');
  });

  it('should skip entries without matching apartment', async () => {
    const entries = [createPaymentEntry({ externalId: 'W999' })];

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.skipped).toBe(1);
    expect(mockTx.payment.createMany).not.toHaveBeenCalled();
  });

  it('should return early when no valid entries', async () => {
    const entries = [createPaymentEntry({ externalId: 'W999' })];

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.skipped).toBe(1);
    expect(mockTx.payment.findMany).not.toHaveBeenCalled();
  });

  it('should create new payments', async () => {
    const entries = [createPaymentEntry()];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.payment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.created).toBe(1);
    expect(mockTx.payment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          apartmentId: 'apt-1',
          year: 2024,
          openingBalance: 0,
          legacyClosingBalance: -100,
          januaryPayments: 100,
          februaryPayments: 100,
          marchPayments: 100,
          aprilPayments: 100,
          mayPayments: 100,
          junePayments: 100,
          julyPayments: 100,
          augustPayments: 100,
          septemberPayments: 100,
          octoberPayments: 100,
          novemberPayments: 100,
          decemberPayments: 100,
          legacyJanuaryCharges: 200,
          legacyFebruaryCharges: 200,
          legacyMarchCharges: 200,
          legacyAprilCharges: 200,
          legacyMayCharges: 200,
          legacyJuneCharges: 200,
          legacyJulyCharges: 200,
          legacyAugustCharges: 200,
          legacySeptemberCharges: 200,
          legacyOctoberCharges: 200,
          legacyNovemberCharges: 200,
          legacyDecemberCharges: 200,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('should update changed payments', async () => {
    const entries = [createPaymentEntry({ closingBalance: -500 })];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
    expect(mockTx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({
        legacyClosingBalance: -500,
      }),
    });
  });

  it('should update the legacy fields when only an imported monthly charge changed', async () => {
    const stored = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      ...buildPaymentData(createPaymentEntry()),
    };
    const changedCharges = Array(12).fill(200);
    changedCharges[2] = 250;
    const entries = [createPaymentEntry({ monthlyCharges: changedCharges })];
    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      stored,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
    expect(mockTx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({ legacyMarchCharges: 250 }),
    });
  });

  it('should not update unchanged payments', async () => {
    const entries = [createPaymentEntry()];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(0);
    expect(mockTx.payment.update).not.toHaveBeenCalled();
  });

  it('should not update payments that differ only beyond the stored scale', async () => {
    const stored = createPaymentEntry({
      openingBalance: '12.3457',
      closingBalance: '-100.1234',
      monthlyPayments: Array(12).fill('100.0001'),
    });
    const entries = [
      createPaymentEntry({
        openingBalance: '12.345650',
        closingBalance: '-100.123449',
        monthlyPayments: Array(12).fill('100.000149'),
      }),
    ];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'payment-1', ...buildPaymentData(stored, 'apt-1') },
    ]);

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(0);
    expect(mockTx.payment.update).not.toHaveBeenCalled();
  });

  it('should update payments that differ at the stored scale', async () => {
    const stored = createPaymentEntry({ closingBalance: '-100.1234' });
    const entries = [createPaymentEntry({ closingBalance: '-100.123600' })];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'payment-1', ...buildPaymentData(stored, 'apt-1') },
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should handle create errors gracefully', async () => {
    const entries = [createPaymentEntry()];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.payment.createMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('DB error')
    );

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Błąd tworzenia płatności');
    expect(stats.skipped).toBe(1);
  });

  it('reports non-Error create failures as unknown errors', async () => {
    const entries = [createPaymentEntry()];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.payment.createMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      'DB error'
    );

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Błąd tworzenia płatności');
    expect(errors[0].message).toContain('Nieznany błąd');
    expect(stats.skipped).toBe(1);
  });

  it('should handle update errors gracefully', async () => {
    const entries = [createPaymentEntry({ closingBalance: -500 })];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update failed')
    );

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Błąd aktualizacji płatności');
    expect(stats.skipped).toBe(1);
  });

  it('reports non-Error update failures as unknown errors', async () => {
    const entries = [createPaymentEntry({ closingBalance: -500 })];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      'Update failed'
    );

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Błąd aktualizacji płatności');
    expect(errors[0].message).toContain('Nieznany błąd');
    expect(stats.skipped).toBe(1);
  });

  it('should detect changes in dateFrom', async () => {
    const entries = [createPaymentEntry({ dateFrom: new Date('2024-02-01') })];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in dateTo', async () => {
    const entries = [createPaymentEntry({ dateTo: new Date('2024-11-30') })];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in openingBalance', async () => {
    const entries = [createPaymentEntry({ openingBalance: 500 })];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in monthly payments', async () => {
    const entries = [
      createPaymentEntry({
        monthlyPayments: [
          150, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        ],
      }),
    ];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in monthly charges', async () => {
    const entries = [
      createPaymentEntry({
        monthlyCharges: [
          250, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
        ],
      }),
    ];

    const existingPayment = {
      id: 'payment-1',
      apartmentId: 'apt-1',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should process multiple entries correctly', async () => {
    apartmentMap.set('W002#APT002', 'apt-2');

    const entries = [
      createPaymentEntry({
        externalId: 'W001',
        apartmentCode: 'APT001',
        year: 2024,
      }),
      createPaymentEntry({
        externalId: 'W002',
        apartmentCode: 'APT002',
        year: 2024,
      }),
    ];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.payment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 2,
    });

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.created).toBe(2);
  });

  it('should handle mixed create and update operations', async () => {
    apartmentMap.set('W002#APT002', 'apt-2');

    const entries = [
      createPaymentEntry({
        externalId: 'W001',
        apartmentCode: 'APT001',
        year: 2024,
      }),
      createPaymentEntry({
        externalId: 'W002',
        apartmentCode: 'APT002',
        year: 2024,
        closingBalance: -999,
      }),
    ];

    const existingPayment = {
      id: 'payment-2',
      apartmentId: 'apt-2',
      year: 2024,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      openingDebt: 0,
      openingSurplus: 0,
      openingBalance: 0,
      legacyClosingBalance: -100,
      januaryPayments: 100,
      februaryPayments: 100,
      marchPayments: 100,
      aprilPayments: 100,
      mayPayments: 100,
      junePayments: 100,
      julyPayments: 100,
      augustPayments: 100,
      septemberPayments: 100,
      octoberPayments: 100,
      novemberPayments: 100,
      decemberPayments: 100,
      legacyJanuaryCharges: 200,
      legacyFebruaryCharges: 200,
      legacyMarchCharges: 200,
      legacyAprilCharges: 200,
      legacyMayCharges: 200,
      legacyJuneCharges: 200,
      legacyJulyCharges: 200,
      legacyAugustCharges: 200,
      legacySeptemberCharges: 200,
      legacyOctoberCharges: 200,
      legacyNovemberCharges: 200,
      legacyDecemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.created).toBe(1);
    expect(stats.updated).toBe(1);
  });
});
