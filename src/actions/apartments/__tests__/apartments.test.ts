import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setApartmentActiveAction } from '@/actions/apartments/apartments';

const mocks = vi.hoisted(() => ({
  requireAdminAction: vi.fn(),
  updateApartmentStatus: vi.fn(),
}));

vi.mock('@/lib/auth/require-action', () => ({
  requireAdminAction: mocks.requireAdminAction,
}));
vi.mock('@/lib/mutations/apartments/update-apartment-status', () => ({
  updateApartmentStatus: mocks.updateApartmentStatus,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe('setApartmentActiveAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAction.mockResolvedValue({
      session: { user: { id: 'admin-1', email: 'admin@example.com' } },
    });
  });

  it('changes the status and returns the new one', async () => {
    mocks.updateApartmentStatus.mockResolvedValue({
      id: 'apt-1',
      isActive: false,
      owner: 'ignored',
    });

    expect(await setApartmentActiveAction('apt-1', false)).toEqual({
      ok: true,
      data: { id: 'apt-1', isActive: false },
    });
    expect(mocks.updateApartmentStatus).toHaveBeenCalledWith('apt-1', false);
  });

  it('rejects a non-boolean status without writing', async () => {
    expect(
      await setApartmentActiveAction('apt-1', 'yes' as unknown as boolean)
    ).toEqual({
      ok: false,
      error: 'Nieprawidłowe dane żądania',
      code: 'invalid',
    });
    expect(mocks.updateApartmentStatus).not.toHaveBeenCalled();
  });

  it('returns the denial and writes nothing when the caller is not an admin', async () => {
    const denied = { ok: false, error: 'Brak uprawnień', code: 'forbidden' };
    mocks.requireAdminAction.mockResolvedValue({ denied });

    expect(await setApartmentActiveAction('apt-1', true)).toBe(denied);
    expect(mocks.updateApartmentStatus).not.toHaveBeenCalled();
  });

  it('reports a failed update', async () => {
    mocks.updateApartmentStatus.mockRejectedValue(new Error('missing'));

    expect(await setApartmentActiveAction('apt-1', true)).toEqual({
      ok: false,
      error: 'Nie udało się zmienić statusu mieszkania',
      code: 'failed',
    });
  });
});
