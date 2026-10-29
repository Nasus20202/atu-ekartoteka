import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const { mockAuth, mockGetDashboardStats } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetDashboardStats: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/queries/admin/get-dashboard-stats', () => ({
  getDashboardStats: mockGetDashboardStats,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn() }),
}));

import { GET } from '@/app/api/admin/stats/route';

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([null, { user: { role: UserRole.TENANT } }])(
    'rejects a non-admin session (%o)',
    async (session) => {
      mockAuth.mockResolvedValue(session);

      const response = await GET();

      expect(response.status).toBe(401);
      expect(mockGetDashboardStats).not.toHaveBeenCalled();
    }
  );

  it('returns the stats to an admin', async () => {
    mockAuth.mockResolvedValue({ user: { role: UserRole.ADMIN } });
    mockGetDashboardStats.mockResolvedValue({ users: 3 });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ users: 3 });
  });

  it('returns 500 when loading stats fails', async () => {
    mockAuth.mockResolvedValue({ user: { role: UserRole.ADMIN } });
    mockGetDashboardStats.mockRejectedValue(new Error('db down'));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Nie udało się pobrać statystyk',
    });
  });
});
