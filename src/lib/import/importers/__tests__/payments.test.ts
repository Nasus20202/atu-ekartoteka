import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importPayments } from '@/lib/import/importers/payments';
import { EntityStats, TransactionClient } from '@/lib/import/types';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';

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
  overrides: Partial<PaymentEntry> = {}
): PaymentEntry {
  return {
    externalId: 'W001',
    apartmentCode: 'APT001',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
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
  };
}

describe('importPayments', () => {
  let mockTx: ReturnType<typeof createMockTx>;
  let stats: EntityStats;
  let errors: string[];
  let apartmentMap: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    stats = createStats();
    errors = [];
    apartmentMap = new Map([['W001#APT001', 'apt-1']]);
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
          closingBalance: -100,
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
          januaryCharges: 200,
          februaryCharges: 200,
          marchCharges: 200,
          aprilCharges: 200,
          mayCharges: 200,
          juneCharges: 200,
          julyCharges: 200,
          augustCharges: 200,
          septemberCharges: 200,
          octoberCharges: 200,
          novemberCharges: 200,
          decemberCharges: 200,
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
        closingBalance: -500,
      }),
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(0);
    expect(mockTx.payment.update).not.toHaveBeenCalled();
  });

  it('should handle create errors gracefully', async () => {
    const entries = [createPaymentEntry()];

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.payment.createMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('DB error')
    );

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd tworzenia płatności');
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
    };

    (mockTx.payment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingPayment,
    ]);
    (mockTx.payment.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update failed')
    );

    await importPayments(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd aktualizacji płatności');
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
      openingBalance: 0,
      closingBalance: -100,
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
      januaryCharges: 200,
      februaryCharges: 200,
      marchCharges: 200,
      aprilCharges: 200,
      mayCharges: 200,
      juneCharges: 200,
      julyCharges: 200,
      augustCharges: 200,
      septemberCharges: 200,
      octoberCharges: 200,
      novemberCharges: 200,
      decemberCharges: 200,
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
