import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsSection } from '@/components/settings/settings-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  getTenantHistoryYearsBack: vi.fn(),
  getPrivacyPolicy: vi.fn(),
}));

vi.mock('@/actions/settings/settings', () => ({
  updateSettingsAction: vi.fn(),
}));
vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/queries/settings/app-settings', () => ({
  getTenantHistoryYearsBack: mocks.getTenantHistoryYearsBack,
  getPrivacyPolicy: mocks.getPrivacyPolicy,
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => vi.fn(),
}));

describe('SettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.getTenantHistoryYearsBack.mockResolvedValue(4);
    mocks.getPrivacyPolicy.mockResolvedValue(null);
  });

  it('renders the form with the stored value', async () => {
    render(await SettingsSection());

    expect(
      screen.getByLabelText('Liczba poprzednich lat widocznych dla mieszkańców')
    ).toHaveValue(4);
  });

  it('shows the stored policy as published', async () => {
    mocks.getPrivacyPolicy.mockResolvedValue('# Polityka');

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
    expect(mocks.getTenantHistoryYearsBack).not.toHaveBeenCalled();
    expect(mocks.getPrivacyPolicy).not.toHaveBeenCalled();
  });
});
