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

function renderPage() {
  return render(
    <ApartmentDetailsPage
      params={Promise.resolve({ hoaId: 'hoa-1', apartmentId: 'apt-1' })}
    />
  );
}

describe('ApartmentDetailsPage', () => {
  it('renders the details when they are ready', () => {
    pending.section = false;
    renderPage();

    expect(screen.getByText('details-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the details load', () => {
    pending.section = true;
    renderPage();

    expect(screen.queryByText('details-loaded')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('apartment-details-skeleton')
    ).toBeInTheDocument();
  });
});
