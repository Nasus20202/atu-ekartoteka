import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  requireAdminAction,
  requireUserAction,
} from '@/lib/auth/require-action';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  hasAdminAccess: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: mocks.hasAdminAccess,
}));

const session = { user: { id: 'user-1', email: 'jan@example.com' } };

describe('requireUserAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session of a signed-in user', async () => {
    mocks.auth.mockResolvedValue(session);

    expect(await requireUserAction()).toEqual({ session });
  });

  it('denies an anonymous caller as unauthenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await requireUserAction()).toEqual({
      denied: {
        ok: false,
        error: 'Musisz być zalogowany',
        code: 'unauthenticated',
      },
    });
  });

  it('denies a session without a user id', async () => {
    mocks.auth.mockResolvedValue({ user: {} });

    const { denied } = await requireUserAction();

    expect(denied?.code).toBe('unauthenticated');
  });
});

describe('requireAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(session);
  });

  it('returns the session of an approved admin', async () => {
    mocks.hasAdminAccess.mockResolvedValue(true);

    expect(await requireAdminAction()).toEqual({ session });
    expect(mocks.hasAdminAccess).toHaveBeenCalledWith('user-1');
  });

  it('denies a non-admin as forbidden, reading the role from the database', async () => {
    mocks.hasAdminAccess.mockResolvedValue(false);

    expect(await requireAdminAction('Settings update attempt')).toEqual({
      denied: { ok: false, error: 'Brak uprawnień', code: 'forbidden' },
    });
  });

  it('denies an anonymous caller without checking the database', async () => {
    mocks.auth.mockResolvedValue(null);

    const { denied } = await requireAdminAction('Settings update attempt');

    expect(denied).toEqual({
      ok: false,
      error: 'Brak uprawnień',
      code: 'unauthenticated',
    });
    expect(mocks.hasAdminAccess).not.toHaveBeenCalled();
  });
});
