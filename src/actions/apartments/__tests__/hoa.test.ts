import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renameHoaAction } from '@/actions/apartments/hoa';

const mocks = vi.hoisted(() => ({
  requireAdminAction: vi.fn(),
  updateHoaName: vi.fn(),
}));

vi.mock('@/lib/auth/require-action', () => ({
  requireAdminAction: mocks.requireAdminAction,
}));
vi.mock('@/lib/mutations/hoa/update-hoa-name', () => ({
  updateHoaName: mocks.updateHoaName,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe('renameHoaAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAction.mockResolvedValue({
      session: { user: { id: 'admin-1' } },
    });
  });

  it('renames the HOA', async () => {
    mocks.updateHoaName.mockResolvedValue({
      id: 'hoa-1',
      name: 'Nowa nazwa',
      externalId: 'W1',
    });

    expect(await renameHoaAction('hoa-1', 'Nowa nazwa')).toEqual({
      ok: true,
      data: { id: 'hoa-1', name: 'Nowa nazwa' },
    });
    expect(mocks.updateHoaName).toHaveBeenCalledWith('hoa-1', 'Nowa nazwa');
  });

  it.each([
    ['an empty id', '', 'Nazwa'],
    ['an empty name', 'hoa-1', ''],
  ])('rejects %s without writing', async (_label, id, name) => {
    expect(await renameHoaAction(id, name)).toEqual({
      ok: false,
      error: 'Brak wymaganych pól',
      code: 'invalid',
    });
    expect(mocks.updateHoaName).not.toHaveBeenCalled();
  });

  it('returns the denial and writes nothing when the caller is not an admin', async () => {
    const denied = {
      ok: false,
      error: 'Musisz być zalogowany',
      code: 'unauthenticated',
    };
    mocks.requireAdminAction.mockResolvedValue({ denied });

    expect(await renameHoaAction('hoa-1', 'Nazwa')).toBe(denied);
    expect(mocks.updateHoaName).not.toHaveBeenCalled();
  });

  it('reports a failed update', async () => {
    mocks.updateHoaName.mockRejectedValue(new Error('not found'));

    expect(await renameHoaAction('hoa-1', 'Nazwa')).toEqual({
      ok: false,
      error: 'Nie udało się zapisać nazwy wspólnoty',
      code: 'failed',
    });
  });
});
