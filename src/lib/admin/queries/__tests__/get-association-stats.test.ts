import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const groupable = () => ({ groupBy: vi.fn() });
  return {
    mockPrisma: {
      homeownersAssociation: { findMany: vi.fn() },
      apartment: { ...groupable(), findMany: vi.fn() },
      charge: groupable(),
      chargeNotification: groupable(),
      payment: groupable(),
      utilitySettlement: groupable(),
      annualCostSettlement: groupable(),
    },
  };
});

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: mockPrisma }));

import { getAssociationStats } from '@/lib/admin/queries/get-association-stats';

const ASSOCIATIONS = [
  {
    id: 'hoa-a',
    name: 'Alfa',
    apartmentsDataDate: new Date('2025-01-15T00:00:00.000Z'),
    chargesDataDate: null,
    notificationsDataDate: new Date('2025-01-20T00:00:00.000Z'),
  },
  {
    id: 'hoa-b',
    name: 'Beta',
    apartmentsDataDate: null,
    chargesDataDate: null,
    notificationsDataDate: null,
  },
];

function mockGroups(groups: unknown[]) {
  return vi.fn().mockResolvedValue(groups);
}

function mockEverything() {
  mockPrisma.homeownersAssociation.findMany.mockResolvedValue(ASSOCIATIONS);
  mockPrisma.apartment.groupBy = mockGroups([
    { homeownersAssociationId: 'hoa-a', _count: { _all: 2 } },
  ]);
  mockPrisma.apartment.findMany.mockResolvedValue([
    { id: 'apt-1', homeownersAssociationId: 'hoa-a' },
    { id: 'apt-2', homeownersAssociationId: 'hoa-a' },
  ]);
  mockPrisma.charge.groupBy = mockGroups([
    { apartmentId: 'apt-1', _count: { _all: 24 }, _max: { period: '202512' } },
    { apartmentId: 'apt-2', _count: { _all: 6 }, _max: { period: '202506' } },
  ]);
  mockPrisma.chargeNotification.groupBy = mockGroups([
    { apartmentId: 'apt-1', _count: { _all: 4 } },
  ]);
  mockPrisma.payment.groupBy = mockGroups([
    { apartmentId: 'apt-2', _count: { _all: 2 } },
  ]);
  mockPrisma.utilitySettlement.groupBy = mockGroups([]);
  mockPrisma.annualCostSettlement.groupBy = mockGroups([]);
}

describe('getAssociationStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEverything();
  });

  it('returns one row per association, ordered as the query returned them', async () => {
    const rows = await getAssociationStats();

    expect(rows.map((row) => row.name)).toEqual(['Alfa', 'Beta']);
    expect(rows[0]).toEqual({
      id: 'hoa-a',
      name: 'Alfa',
      apartments: 2,
      charges: 30,
      notifications: 4,
      payments: 2,
      utilitySettlements: 0,
      annualSettlements: 0,
      lastChargePeriod: '2025-12-01T00:00:00.000Z',
      apartmentsDataDate: '2025-01-15T00:00:00.000Z',
      chargesDataDate: null,
      notificationsDataDate: '2025-01-20T00:00:00.000Z',
    });
    expect(rows[1]).toMatchObject({
      id: 'hoa-b',
      apartments: 0,
      charges: 0,
      lastChargePeriod: null,
    });
  });

  it('orders the associations by name in the query', async () => {
    await getAssociationStats();

    expect(mockPrisma.homeownersAssociation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      })
    );
  });

  it('groups per apartment and never loads charge or payment rows', async () => {
    await getAssociationStats();

    expect(mockPrisma.charge.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['apartmentId'],
        _max: { period: true },
      })
    );
    expect(mockPrisma.payment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['apartmentId'] })
    );
    expect(mockPrisma.apartment.findMany).toHaveBeenCalledWith({
      select: { id: true, homeownersAssociationId: true },
    });
  });

  it('runs the same number of queries whatever the number of associations', async () => {
    mockPrisma.homeownersAssociation.findMany.mockResolvedValue(
      Array.from({ length: 50 }, (_, index) => ({
        id: `hoa-${index}`,
        name: `Wspólnota ${index}`,
        apartmentsDataDate: null,
        chargesDataDate: null,
        notificationsDataDate: null,
      }))
    );

    const rows = await getAssociationStats();

    expect(rows).toHaveLength(50);
    expect(mockPrisma.homeownersAssociation.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.apartment.groupBy).toHaveBeenCalledTimes(1);
    expect(mockPrisma.apartment.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.charge.groupBy).toHaveBeenCalledTimes(1);
    expect(mockPrisma.annualCostSettlement.groupBy).toHaveBeenCalledTimes(1);
  });
});
