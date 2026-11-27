import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/auth/types/account';

const { mockAuth, mockGetDashboardStats, mockGetAssociationStats, calls } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockGetDashboardStats: vi.fn(),
    mockGetAssociationStats: vi.fn(),
    calls: [] as string[],
  }));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/admin/queries/get-dashboard-stats', () => ({
  getDashboardStats: mockGetDashboardStats,
}));
vi.mock('@/lib/admin/queries/get-association-stats', () => ({
  getAssociationStats: mockGetAssociationStats,
}));
vi.mock('@/lib/auth/queries/has-admin-access', () => ({
  hasAdminAccess: vi.fn((userId: string) =>
    Promise.resolve(userId.startsWith('admin'))
  ),
}));
vi.mock('@/lib/auth/rules/admin-access', () => ({
  isAdminRole: (role: string | null | undefined) => role === 'ADMIN',
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ error: vi.fn() }),
}));

import { GET } from '@/app/api/admin/stats/route';

const ADMIN_SESSION = { user: { id: 'admin-id', role: UserRole.ADMIN } };
const URL_PREFIX = 'http://localhost/api/admin/stats';

function request(query = '') {
  return new Request(`${URL_PREFIX}${query}`);
}

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    mockGetDashboardStats.mockImplementation(async () => {
      calls.push('summary');
      return { users: 3 };
    });
    mockGetAssociationStats.mockImplementation(async () => {
      calls.push('associations');
      return [{ id: 'hoa-1' }];
    });
  });

  it.each([
    [null, 401],
    [{ user: { id: 'user-1', role: UserRole.TENANT } }, 403],
  ])('rejects a non-admin session (%o)', async (session, expected) => {
    mockAuth.mockResolvedValue(session);

    const response = await GET(request('?associations=true'));

    expect(response.status).toBe(expected);
    expect(mockGetDashboardStats).not.toHaveBeenCalled();
    expect(mockGetAssociationStats).not.toHaveBeenCalled();
  });

  it('returns only the summary without the associations parameter', async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ users: 3 });
    expect(calls).toEqual(['summary']);
  });

  it.each([
    '?associations=false',
    '?associations=1',
    '?associations=',
    '?other=true',
  ])('treats %s as absent', async (query) => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    const response = await GET(request(query));

    await expect(response.json()).resolves.toEqual({ users: 3 });
    expect(calls).toEqual(['summary']);
  });

  it('returns the summary with the associations when the parameter is true', async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    const response = await GET(request('?associations=true'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      users: 3,
      associations: [{ id: 'hoa-1' }],
    });
  });

  it('loads the summary and then the associations, one group at a time', async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);

    await GET(request('?associations=true'));

    expect(calls).toEqual(['summary', 'associations']);
  });

  it('returns 500 when loading stats fails', async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockGetDashboardStats.mockRejectedValue(new Error('db down'));

    const response = await GET(request('?associations=true'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Nie udało się pobrać statystyk',
    });
    expect(mockGetAssociationStats).not.toHaveBeenCalled();
  });
});
