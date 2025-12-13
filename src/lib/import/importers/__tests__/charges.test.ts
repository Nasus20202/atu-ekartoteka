import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importCharges } from '@/lib/import/importers/charges';
import { EntityStats, TransactionClient } from '@/lib/import/types';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';

function createMockTx() {
  return {
    charge: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as TransactionClient;
}

function createStats(): EntityStats {
  return { total: 0, created: 0, updated: 0, skipped: 0, deleted: 0 };
}

function createChargeEntry(
  overrides: Partial<NalCzynszEntry> = {}
): NalCzynszEntry {
  return {
    id: 'W001',
    apartmentExternalId: 'APT001',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-01-31'),
    period: '2024-01',
    lineNo: 1,
    description: 'Test charge',
    quantity: 1,
    unit: 'szt',
    unitPrice: 100,
    totalAmount: 100,
    ...overrides,
  };
}

describe('importCharges', () => {
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
    const entries = [createChargeEntry({ id: 'W999' })];

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.skipped).toBe(1);
    expect(mockTx.charge.findMany).not.toHaveBeenCalled();
  });

  it('should return early when no valid entries', async () => {
    const entries = [createChargeEntry({ id: 'W999' })];

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.skipped).toBe(1);
    expect(mockTx.charge.createMany).not.toHaveBeenCalled();
  });

  it('should create new charges', async () => {
    const entries = [createChargeEntry()];

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.charge.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.created).toBe(1);
    expect(mockTx.charge.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          apartmentId: 'apt-1',
          period: '2024-01',
          externalLineNo: 1,
          description: 'Test charge',
          quantity: 1,
          unit: 'szt',
          unitPrice: 100,
          totalAmount: 100,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('should update changed charges', async () => {
    const entries = [createChargeEntry({ description: 'Updated charge' })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Old charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
    expect(mockTx.charge.update).toHaveBeenCalledWith({
      where: { id: 'charge-1' },
      data: expect.objectContaining({
        description: 'Updated charge',
      }),
    });
  });

  it('should not update unchanged charges', async () => {
    const entries = [createChargeEntry()];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(0);
    expect(mockTx.charge.update).not.toHaveBeenCalled();
  });

  it('should handle create errors gracefully', async () => {
    const entries = [createChargeEntry()];

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.charge.createMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('DB error')
    );

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd tworzenia naliczeń');
    expect(stats.skipped).toBe(1);
  });

  it('should handle update errors gracefully', async () => {
    const entries = [createChargeEntry({ description: 'Updated' })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Old',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update failed')
    );

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd aktualizacji naliczenia');
    expect(stats.skipped).toBe(1);
  });

  it('should detect changes in dateFrom', async () => {
    const entries = [createChargeEntry({ dateFrom: new Date('2024-02-01') })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in dateTo', async () => {
    const entries = [createChargeEntry({ dateTo: new Date('2024-02-28') })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in quantity', async () => {
    const entries = [createChargeEntry({ quantity: 5 })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in unit', async () => {
    const entries = [createChargeEntry({ unit: 'm2' })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in unitPrice', async () => {
    const entries = [createChargeEntry({ unitPrice: 200 })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in totalAmount', async () => {
    const entries = [createChargeEntry({ totalAmount: 500 })];

    const existingCharge = {
      id: 'charge-1',
      apartmentId: 'apt-1',
      period: '2024-01',
      externalLineNo: 1,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should process multiple entries correctly', async () => {
    apartmentMap.set('W002#APT002', 'apt-2');

    const entries = [
      createChargeEntry({
        id: 'W001',
        apartmentExternalId: 'APT001',
        lineNo: 1,
      }),
      createChargeEntry({
        id: 'W002',
        apartmentExternalId: 'APT002',
        lineNo: 2,
      }),
    ];

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.charge.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 2,
    });

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.created).toBe(2);
  });

  it('should handle mixed create and update operations', async () => {
    apartmentMap.set('W002#APT002', 'apt-2');

    const entries = [
      createChargeEntry({
        id: 'W001',
        apartmentExternalId: 'APT001',
        lineNo: 1,
      }),
      createChargeEntry({
        id: 'W002',
        apartmentExternalId: 'APT002',
        lineNo: 2,
        description: 'Updated',
      }),
    ];

    const existingCharge = {
      id: 'charge-2',
      apartmentId: 'apt-2',
      period: '2024-01',
      externalLineNo: 2,
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      description: 'Old',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      existingCharge,
    ]);
    (mockTx.charge.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });
    (mockTx.charge.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.created).toBe(1);
    expect(stats.updated).toBe(1);
  });

  it('should correctly count skipped entries with mixed valid/invalid', async () => {
    const entries = [
      createChargeEntry({ id: 'W001', apartmentExternalId: 'APT001' }),
      createChargeEntry({ id: 'W999', apartmentExternalId: 'APT999' }),
    ];

    (mockTx.charge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockTx.charge.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    await importCharges(mockTx, apartmentMap, entries, stats, errors);

    expect(stats.skipped).toBe(1);
    expect(stats.created).toBe(1);
  });
});
