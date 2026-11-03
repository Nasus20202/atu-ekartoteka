import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import HoaApartmentsPage from '@/app/admin/apartments/[hoaId]/page';

const pending = vi.hoisted(() => ({ section: false }));

vi.mock('@/components/apartments/hoa-apartments-section', () => ({
  HoaApartmentsSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>apartments-loaded</div>;
  },
}));

function renderPage() {
  return render(
    <HoaApartmentsPage
      params={Promise.resolve({ hoaId: 'hoa-1' })}
      searchParams={Promise.resolve({})}
    />
  );
}

describe('HoaApartmentsPage', () => {
  it('renders the list when its data is ready', () => {
    pending.section = false;
    renderPage();

    expect(screen.getByText('apartments-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the list loads', () => {
    pending.section = true;
    renderPage();

    expect(screen.queryByText('apartments-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('apartment-list-skeleton')).toBeInTheDocument();
  });
});
