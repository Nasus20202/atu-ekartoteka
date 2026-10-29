import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdmin, UNAUTHORIZED_MESSAGE } from '@/lib/auth/require-admin';
import { UserRole } from '@/lib/types';

const { mockAuth, mockWarn } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: mockWarn }),
}));

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session of an admin', async () => {
    const session = { user: { email: 'a@b.pl', role: UserRole.ADMIN } };
    mockAuth.mockResolvedValue(session);

    expect(await requireAdmin('attempt')).toEqual({ session });
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('rejects a tenant and logs the attempt', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 't@b.pl', role: UserRole.TENANT },
    });

    const { response } = await requireAdmin('attempt');

    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({ error: UNAUTHORIZED_MESSAGE });
    expect(mockWarn).toHaveBeenCalledWith({ email: 't@b.pl' }, 'attempt');
  });

  it('rejects anonymous requests without logging by default', async () => {
    mockAuth.mockResolvedValue(null);

    const { response } = await requireAdmin();

    expect(response?.status).toBe(401);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('logs anonymous attempts', async () => {
    mockAuth.mockResolvedValue(null);

    await requireAdmin('attempt');

    expect(mockWarn).toHaveBeenCalledWith({ email: 'anonymous' }, 'attempt');
  });
});
