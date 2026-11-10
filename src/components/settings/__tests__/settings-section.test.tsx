import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsSection } from '@/components/settings/settings-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  readAllSettings: vi.fn(),
}));

vi.mock('@/actions/settings/settings', () => ({
  updateSettingsAction: vi.fn(),
}));
vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/queries/settings/app-settings', () => ({
  readAllSettings: mocks.readAllSettings,
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => vi.fn(),
}));

describe('SettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.readAllSettings.mockResolvedValue({
      tenantHistoryYearsBack: 4,
      privacyPolicy: null,
    });
  });

  it('renders the form with the stored value', async () => {
    render(await SettingsSection());

    expect(
      screen.getByLabelText('Liczba poprzednich lat widocznych dla mieszkańców')
    ).toHaveValue(4);
  });

  it('shows the stored policy as published', async () => {
    mocks.readAllSettings.mockResolvedValue({
      tenantHistoryYearsBack: 4,
      privacyPolicy: '# Polityka',
    });

    render(await SettingsSection());

    expect(screen.getByText('Opublikowana')).toBeInTheDocument();
  });

  it('shows an unpublished policy when none is stored', async () => {
    render(await SettingsSection());

    expect(screen.getByText('Nieopublikowana')).toBeInTheDocument();
  });

  it('does not read settings when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(SettingsSection()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.readAllSettings).not.toHaveBeenCalled();
  });
});
