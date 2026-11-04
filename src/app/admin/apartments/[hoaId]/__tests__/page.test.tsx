import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import HoaApartmentsPage from '@/app/admin/apartments/[hoaId]/page';

const pending = vi.hoisted(() => ({ section: false }));
const modeMock = vi.hoisted(() => ({ value: 'cards' }));

vi.mock('@/lib/list-view-mode-server', () => ({
  getListViewMode: () => Promise.resolve(modeMock.value),
}));

vi.mock('@/components/apartments/hoa-apartments-section', () => ({
  HoaApartmentsSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>apartments-loaded</div>;
  },
}));

async function renderPage() {
  return render(
    await HoaApartmentsPage({
      params: Promise.resolve({ hoaId: 'hoa-1' }),
      searchParams: Promise.resolve({}),
    })
  );
}

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: vi.fn(),
}));

describe('HoaApartmentsPage', () => {
  it('renders the list when its data is ready', async () => {
    pending.section = false;
    await renderPage();

    expect(screen.getByText('apartments-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the list loads', async () => {
    pending.section = true;
    await renderPage();

    expect(screen.queryByText('apartments-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('apartment-list-skeleton')).toBeInTheDocument();
  });

  it('shows a table skeleton when the user chose the table view', async () => {
    pending.section = true;
    modeMock.value = 'table';
    await renderPage();

    expect(screen.getByTestId('apartment-list-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('apartment-list-skeleton')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});
