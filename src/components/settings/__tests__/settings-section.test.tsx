import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsSection } from '@/components/settings/settings-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  getAppSettings: vi.fn(),
}));

vi.mock('@/actions/settings', () => ({ updateSettingsAction: vi.fn() }));
vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/queries/settings/get-app-settings', () => ({
  getAppSettings: mocks.getAppSettings,
}));

describe('SettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.getAppSettings.mockResolvedValue({ tenantHistoryYearsBack: 4 });
  });

  it('renders the form with the stored value', async () => {
    render(await SettingsSection());

    expect(
      screen.getByLabelText('Liczba poprzednich lat widocznych dla mieszkańców')
    ).toHaveValue(4);
  });

  it('does not read settings when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(SettingsSection()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getAppSettings).not.toHaveBeenCalled();
  });
});
