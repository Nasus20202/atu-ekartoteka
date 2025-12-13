import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importNotifications } from '@/lib/import/importers/notifications';
import { EntityStats, HOAContext, TransactionClient } from '@/lib/import/types';
import { ChargeNotificationEntry } from '@/lib/parsers/pow-czynsz-parser';

function createMockTx() {
  return {
    chargeNotification: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as unknown as TransactionClient;
}

function createMockHoa(id = 'hoa-1'): HOAContext {
  return { id, externalId: 'TEST01' };
}

function createStats(): EntityStats {
  return { total: 0, created: 0, updated: 0, skipped: 0, deleted: 0 };
}

function createNotificationEntry(
  overrides: Partial<ChargeNotificationEntry> = {}
): ChargeNotificationEntry {
  return {
    externalId: 'W001',
    apartmentCode: 'APT001',
    lineNo: 1,
    description: 'Test charge',
    quantity: 1,
    unit: 'szt',
    unitPrice: 100,
    totalAmount: 100,
    ...overrides,
  };
}

describe('importNotifications', () => {
  let mockTx: ReturnType<typeof createMockTx>;
  let hoa: HOAContext;
  let stats: EntityStats;
  let errors: string[];
  let apartmentMap: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    hoa = createMockHoa();
    stats = createStats();
    errors = [];
    apartmentMap = new Map([['W001#APT001', 'apt-1']]);
  });

  it('should skip entries without matching apartment', async () => {
    const entries = [createNotificationEntry({ externalId: 'W999' })];

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([]) // for stale deletion check
      .mockResolvedValueOnce([]); // for existing notifications

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.skipped).toBe(1);
    expect(mockTx.chargeNotification.createMany).not.toHaveBeenCalled();
  });

  it('should create new notifications', async () => {
    const entries = [createNotificationEntry()];

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([]) // existing notifications
      .mockResolvedValueOnce([]); // stale notifications

    (
      mockTx.chargeNotification.createMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      count: 1,
    });

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.created).toBe(1);
    expect(mockTx.chargeNotification.createMany).toHaveBeenCalledWith({
      data: [
        {
          apartmentId: 'apt-1',
          lineNo: 1,
          description: 'Test charge',
          quantity: 1,
          unit: 'szt',
          unitPrice: 100,
          totalAmount: 100,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('should update changed notifications', async () => {
    const entries = [
      createNotificationEntry({ description: 'Updated charge' }),
    ];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Old charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification]) // existing notifications
      .mockResolvedValueOnce([existingNotification]); // stale check

    (
      mockTx.chargeNotification.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.updated).toBe(1);
    expect(mockTx.chargeNotification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: {
        description: 'Updated charge',
        quantity: 1,
        unit: 'szt',
        unitPrice: 100,
        totalAmount: 100,
      },
    });
  });

  it('should not update unchanged notifications', async () => {
    const entries = [createNotificationEntry()];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification])
      .mockResolvedValueOnce([existingNotification]);

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.updated).toBe(0);
    expect(mockTx.chargeNotification.update).not.toHaveBeenCalled();
  });

  it('should delete stale notifications', async () => {
    const entries: ChargeNotificationEntry[] = [];

    const staleNotification = {
      id: 'stale-1',
      apartmentId: 'apt-1',
      lineNo: 99,
    };

    (
      mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([staleNotification]);
    (
      mockTx.chargeNotification.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      count: 1,
    });

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.deleted).toBe(1);
    expect(mockTx.chargeNotification.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['stale-1'] } },
    });
  });

  it('should handle create errors gracefully', async () => {
    const entries = [createNotificationEntry()];

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    (
      mockTx.chargeNotification.createMany as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('DB error'));

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd tworzenia powiadomień');
    expect(stats.skipped).toBe(1);
  });

  it('should handle update errors gracefully', async () => {
    const entries = [createNotificationEntry({ description: 'Updated' })];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Old',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification])
      .mockResolvedValueOnce([existingNotification]);

    (
      mockTx.chargeNotification.update as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('Update failed'));

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd aktualizacji powiadomienia');
    expect(stats.skipped).toBe(1);
  });

  it('should detect changes in quantity', async () => {
    const entries = [createNotificationEntry({ quantity: 5 })];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification])
      .mockResolvedValueOnce([existingNotification]);

    (
      mockTx.chargeNotification.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in unit', async () => {
    const entries = [createNotificationEntry({ unit: 'm2' })];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification])
      .mockResolvedValueOnce([existingNotification]);

    (
      mockTx.chargeNotification.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in unitPrice', async () => {
    const entries = [createNotificationEntry({ unitPrice: 200 })];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification])
      .mockResolvedValueOnce([existingNotification]);

    (
      mockTx.chargeNotification.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in totalAmount', async () => {
    const entries = [createNotificationEntry({ totalAmount: 500 })];

    const existingNotification = {
      id: 'notif-1',
      apartmentId: 'apt-1',
      lineNo: 1,
      description: 'Test charge',
      quantity: 1,
      unit: 'szt',
      unitPrice: 100,
      totalAmount: 100,
    };

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingNotification])
      .mockResolvedValueOnce([existingNotification]);

    (
      mockTx.chargeNotification.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.updated).toBe(1);
  });

  it('should process multiple entries correctly', async () => {
    apartmentMap.set('W002#APT002', 'apt-2');

    const entries = [
      createNotificationEntry({
        externalId: 'W001',
        apartmentCode: 'APT001',
        lineNo: 1,
      }),
      createNotificationEntry({
        externalId: 'W002',
        apartmentCode: 'APT002',
        lineNo: 2,
      }),
    ];

    (mockTx.chargeNotification.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    (
      mockTx.chargeNotification.createMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      count: 2,
    });

    await importNotifications(
      mockTx,
      hoa,
      apartmentMap,
      entries,
      stats,
      errors
    );

    expect(stats.created).toBe(2);
  });
});
