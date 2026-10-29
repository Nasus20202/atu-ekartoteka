import { describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const counter = (value: number) => ({
    count: vi.fn().mockResolvedValue(value),
  });
  return {
    mockPrisma: {
      homeownersAssociation: counter(1),
      apartment: counter(2),
      charge: counter(3),
      chargeNotification: counter(4),
      payment: counter(5),
      user: counter(6),
    },
  };
});

vi.mock('@/lib/database/prisma', () => ({ prisma: mockPrisma }));

import { getDashboardStats } from '@/lib/queries/admin/get-dashboard-stats';

describe('getDashboardStats', () => {
  it('returns the row count of every table', async () => {
    await expect(getDashboardStats()).resolves.toEqual({
      hoa: 1,
      apartments: 2,
      charges: 3,
      notifications: 4,
      payments: 5,
      users: 6,
    });
  });
});
