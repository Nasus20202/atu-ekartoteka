import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ApartmentsPage from '@/app/admin/apartments/page';

const pending = vi.hoisted(() => ({ section: false }));

vi.mock('@/components/apartments/hoa-list-section', () => ({
  HoaListSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>hoa-list-loaded</div>;
  },
}));

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: vi.fn(),
}));

describe('ApartmentsPage', () => {
  it('renders the list when its data is ready', async () => {
    pending.section = false;
    render(await ApartmentsPage());

    expect(screen.getByText('hoa-list-loaded')).toBeInTheDocument();
  });

  it('shows the header and a skeleton while the list loads', async () => {
    pending.section = true;
    render(await ApartmentsPage());

    expect(screen.getByText('Wspólnoty mieszkaniowe')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Nagłówki i stopki/ })
    ).toBeInTheDocument();
    expect(screen.queryByText('hoa-list-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('hoa-grid-skeleton')).toBeInTheDocument();
  });
});
