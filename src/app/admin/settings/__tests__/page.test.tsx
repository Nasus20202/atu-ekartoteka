import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import SettingsPage from '@/app/admin/settings/page';

const pending = vi.hoisted(() => ({ section: false }));

vi.mock('@/components/settings/settings-section', () => ({
  SettingsSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>settings-loaded</div>;
  },
}));

describe('SettingsPage', () => {
  it('renders the form section when its data is ready', () => {
    pending.section = false;
    render(<SettingsPage />);

    expect(screen.getByText('Ustawienia')).toBeInTheDocument();
    expect(screen.getByText('settings-loaded')).toBeInTheDocument();
  });

  it('shows the header and a skeleton while the section loads', () => {
    pending.section = true;
    const { container } = render(<SettingsPage />);

    expect(screen.getByText('Ustawienia')).toBeInTheDocument();
    expect(screen.queryByText('settings-loaded')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
