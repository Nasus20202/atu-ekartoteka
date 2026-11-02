import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockFindHoaNotices = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/queries/hoa/find-hoa-notices', () => ({
  findHoaNotices: mockFindHoaNotices,
}));

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: vi.fn((userId: string) =>
    Promise.resolve(userId.startsWith('admin'))
  ),
  isAdminRole: (role: string | null | undefined) => role === 'ADMIN',
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('GET /api/admin/hoa/notices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when the user is not an admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', role: UserRole.TENANT },
    });

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockFindHoaNotices).not.toHaveBeenCalled();
  });

  it('returns the header and footer of every HOA for an admin', async () => {
    const hoas = [
      {
        id: 'hoa-1',
        externalId: 'EXT-001',
        name: 'Wspólnota A',
        header: 'Nagłówek',
        footer: null,
      },
    ];
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-id', role: UserRole.ADMIN },
    });
    mockFindHoaNotices.mockResolvedValueOnce(hoas);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ homeownersAssociations: hoas });
  });

  it('returns 500 when the query fails', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-id', role: UserRole.ADMIN },
    });
    mockFindHoaNotices.mockRejectedValueOnce(new Error('db down'));

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(500);
  });
});
