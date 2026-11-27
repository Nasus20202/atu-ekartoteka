import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const model = () => ({ aggregate: vi.fn(), count: vi.fn() });
  return {
    mockPrisma: {
      homeownersAssociation: model(),
      apartment: model(),
      user: model(),
      charge: { ...model(), findFirst: vi.fn() },
      chargeNotification: model(),
      payment: model(),
      utilitySettlement: model(),
      meterReading: model(),
      annualCostSettlement: model(),
    },
  };
});

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: mockPrisma }));

import { getDashboardStats } from '@/lib/admin/queries/get-dashboard-stats';

const UPDATED = new Date('2026-02-03T10:00:00.000Z');
const EMPTY = { _count: { _all: 0 }, _min: {}, _max: {} };

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const model of Object.values(mockPrisma)) {
      model.aggregate.mockResolvedValue(EMPTY);
      model.count.mockResolvedValue(0);
    }
    mockPrisma.charge.findFirst.mockResolvedValue(null);
  });

  it('counts every data type and reads its range and last change in the database', async () => {
    const hoa = { _count: { _all: 2 }, _max: { updatedAt: UPDATED } };
    mockPrisma.homeownersAssociation.aggregate.mockResolvedValue(hoa);
    mockPrisma.apartment.aggregate.mockResolvedValue({
      _count: { _all: 7 },
      _max: { updatedAt: UPDATED },
    });
    mockPrisma.apartment.count.mockResolvedValue(4);
    mockPrisma.charge.count.mockResolvedValue(40);
    mockPrisma.charge.findFirst.mockImplementation(
      async ({ orderBy }: { orderBy: Record<string, string> }) => {
        if (orderBy.period === 'asc') return { period: '202501' };
        if (orderBy.period === 'desc') return { period: '202512' };
        return { updatedAt: UPDATED };
      }
    );
    mockPrisma.payment.aggregate.mockResolvedValue({
      _count: { _all: 5 },
      _min: { dateFrom: new Date('2025-01-01T00:00:00.000Z') },
      _max: {
        dateTo: new Date('2025-12-31T00:00:00.000Z'),
        updatedAt: UPDATED,
      },
    });
    mockPrisma.meterReading.aggregate.mockResolvedValue({
      _count: { _all: 30 },
      _min: { startDate: new Date('2024-01-01T00:00:00.000Z') },
      _max: { endDate: new Date('2024-12-31T00:00:00.000Z') },
    });

    const stats = await getDashboardStats();

    expect(stats.hoa).toEqual({
      count: 2,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: '2026-02-03T10:00:00.000Z',
    });
    expect(stats.apartments).toEqual({
      count: 7,
      active: 4,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: '2026-02-03T10:00:00.000Z',
    });
    expect(stats.charges).toEqual({
      count: 40,
      rangeFrom: '2025-01-01T00:00:00.000Z',
      rangeTo: '2025-12-01T00:00:00.000Z',
      lastChangedAt: '2026-02-03T10:00:00.000Z',
    });
    expect(stats.payments).toEqual({
      count: 5,
      rangeFrom: '2025-01-01T00:00:00.000Z',
      rangeTo: '2025-12-31T00:00:00.000Z',
      lastChangedAt: '2026-02-03T10:00:00.000Z',
    });
    expect(stats.meterReadings).toEqual({
      count: 30,
      rangeFrom: '2024-01-01T00:00:00.000Z',
      rangeTo: '2024-12-31T00:00:00.000Z',
      lastChangedAt: null,
    });
  });

  it('reads the charge figures with a count and three index lookups, not an aggregate', async () => {
    await getDashboardStats();

    expect(mockPrisma.charge.aggregate).not.toHaveBeenCalled();
    expect(mockPrisma.charge.count).toHaveBeenCalledWith();
    expect(mockPrisma.charge.findFirst).toHaveBeenCalledTimes(3);
    expect(mockPrisma.charge.findFirst).toHaveBeenCalledWith({
      orderBy: { period: 'asc' },
      select: { period: true },
    });
    expect(mockPrisma.charge.findFirst).toHaveBeenCalledWith({
      orderBy: { period: 'desc' },
      select: { period: true },
    });
    expect(mockPrisma.charge.findFirst).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
  });

  it('returns no charge range or change for an empty charge table', async () => {
    const stats = await getDashboardStats();

    expect(stats.charges).toEqual({
      count: 0,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: null,
    });
  });

  it('returns zero counts and no ranges for empty tables', async () => {
    const stats = await getDashboardStats();

    expect(stats.annualSettlements).toEqual({
      count: 0,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: null,
    });
    expect(stats.apartments.active).toBe(0);
  });

  it('counts the active apartments with a filter', async () => {
    await getDashboardStats();

    expect(mockPrisma.apartment.count).toHaveBeenCalledWith({
      where: { isActive: true },
    });
  });

  it('runs at most ten queries at once, the size of the connection pool', async () => {
    let inFlight = 0;
    let peak = 0;
    const track =
      <T>(value: T) =>
      async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return value;
      };
    for (const model of Object.values(mockPrisma)) {
      model.aggregate.mockImplementation(track(EMPTY));
      model.count.mockImplementation(track(0));
    }
    mockPrisma.charge.findFirst.mockImplementation(track(null));

    await getDashboardStats();

    expect(peak).toBeLessThanOrEqual(10);
  });
});
