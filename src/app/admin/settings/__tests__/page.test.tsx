import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import SettingsPage from '@/app/admin/settings/page';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

const pending = vi.hoisted(() => ({ section: false }));

vi.mock('@/components/settings/settings-section', () => ({
  SettingsSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>settings-loaded</div>;
  },
}));

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: vi.fn(),
}));

describe('SettingsPage', () => {
  it('checks admin access before rendering', async () => {
    pending.section = false;

    await SettingsPage();

    expect(requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it('renders the form section when its data is ready', async () => {
    pending.section = false;
    render(await SettingsPage());

    expect(screen.getByText('Ustawienia')).toBeInTheDocument();
    expect(screen.getByText('settings-loaded')).toBeInTheDocument();
  });

  it('shows the header and a skeleton while the section loads', async () => {
    pending.section = true;
    const { container } = render(await SettingsPage());

    expect(screen.getByText('Ustawienia')).toBeInTheDocument();
    expect(screen.queryByText('settings-loaded')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
