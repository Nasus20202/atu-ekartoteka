import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ApartmentDetailsPage from '@/app/admin/apartments/[hoaId]/[apartmentId]/page';

const pending = vi.hoisted(() => ({ section: false }));

vi.mock('@/components/apartments/apartment-details-section', () => ({
  ApartmentDetailsSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>details-loaded</div>;
  },
}));

async function renderPage() {
  return render(
    await ApartmentDetailsPage({
      params: Promise.resolve({ hoaId: 'hoa-1', apartmentId: 'apt-1' }),
    })
  );
}

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: vi.fn(),
}));

describe('ApartmentDetailsPage', () => {
  it('renders the details when they are ready', async () => {
    pending.section = false;
    await renderPage();

    expect(screen.getByText('details-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the details load', async () => {
    pending.section = true;
    await renderPage();

    expect(screen.queryByText('details-loaded')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('apartment-details-skeleton')
    ).toBeInTheDocument();
  });
});
