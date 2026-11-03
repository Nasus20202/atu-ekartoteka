import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateSettingsAction } from '@/actions/settings';

const mocks = vi.hoisted(() => ({
  requireAdminAction: vi.fn(),
  updateAppSettings: vi.fn(),
}));

vi.mock('@/lib/auth/require-action', () => ({
  requireAdminAction: mocks.requireAdminAction,
}));
vi.mock('@/lib/mutations/settings/update-app-settings', () => ({
  updateAppSettings: mocks.updateAppSettings,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe('updateSettingsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAction.mockResolvedValue({
      session: { user: { id: 'admin-1' } },
    });
  });

  it('saves a valid history window and returns the stored values', async () => {
    mocks.updateAppSettings.mockResolvedValue({ tenantHistoryYearsBack: 3 });

    const result = await updateSettingsAction({ tenantHistoryYearsBack: 3 });

    expect(result).toEqual({
      ok: true,
      data: { tenantHistoryYearsBack: 3 },
    });
    expect(mocks.updateAppSettings).toHaveBeenCalledWith({
      tenantHistoryYearsBack: 3,
    });
  });

  it.each([
    ['a negative number', { tenantHistoryYearsBack: -1 }],
    ['a number above the limit', { tenantHistoryYearsBack: 21 }],
    ['a string', { tenantHistoryYearsBack: '3' }],
    ['no body', null],
  ])('rejects %s without writing', async (_label, input) => {
    const result = await updateSettingsAction(input);

    expect(result).toEqual({
      ok: false,
      error: 'Nieprawidłowe ustawienia',
      code: 'invalid',
    });
    expect(mocks.updateAppSettings).not.toHaveBeenCalled();
  });

  it('returns the denial and writes nothing when the caller is not an admin', async () => {
    const denied = { ok: false, error: 'Brak uprawnień', code: 'forbidden' };
    mocks.requireAdminAction.mockResolvedValue({ denied });

    expect(await updateSettingsAction({ tenantHistoryYearsBack: 3 })).toBe(
      denied
    );
    expect(mocks.updateAppSettings).not.toHaveBeenCalled();
  });

  it('reports a failed save', async () => {
    mocks.updateAppSettings.mockRejectedValue(new Error('db down'));

    expect(await updateSettingsAction({ tenantHistoryYearsBack: 3 })).toEqual({
      ok: false,
      error: 'Nie udało się zapisać ustawień',
      code: 'failed',
    });
  });
});
