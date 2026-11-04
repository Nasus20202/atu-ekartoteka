import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  requireAdminAction,
  requireUserAction,
} from '@/lib/auth/require-action';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  hasAdminAccess: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: mocks.hasAdminAccess,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: mocks.warn }),
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

  it('logs an anonymous denial with the attempt label', async () => {
    mocks.auth.mockResolvedValue(null);

    await requireAdminAction('Settings update attempt');

    expect(mocks.warn).toHaveBeenCalledWith(
      { email: 'anonymous' },
      'Settings update attempt'
    );
  });

  it('does not log an anonymous denial without an attempt label', async () => {
    mocks.auth.mockResolvedValue(null);

    await requireAdminAction();

    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it('logs a forbidden attempt with the caller email', async () => {
    mocks.hasAdminAccess.mockResolvedValue(false);

    await requireAdminAction('Settings update attempt');

    expect(mocks.warn).toHaveBeenCalledWith(
      { email: 'jan@example.com' },
      'Settings update attempt'
    );
  });

  it('logs a forbidden attempt as anonymous when the session has no email', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-2', email: null } });
    mocks.hasAdminAccess.mockResolvedValue(false);

    await requireAdminAction('Settings update attempt');

    expect(mocks.warn).toHaveBeenCalledWith(
      { email: 'anonymous' },
      'Settings update attempt'
    );
  });

  it('does not log a forbidden call without an attempt label', async () => {
    mocks.hasAdminAccess.mockResolvedValue(false);

    await requireAdminAction();

    expect(mocks.warn).not.toHaveBeenCalled();
  });
});
