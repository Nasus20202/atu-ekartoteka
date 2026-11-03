import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ApartmentDetailsLoading from '@/app/admin/apartments/[hoaId]/[apartmentId]/loading';
import HoaApartmentsLoading from '@/app/admin/apartments/[hoaId]/loading';
import ApartmentsLoading from '@/app/admin/apartments/loading';
import SettingsLoading from '@/app/admin/settings/loading';
import UsersLoading from '@/app/admin/users/loading';

vi.mock('@/lib/list-view-mode-server', () => ({
  getListViewMode: () => Promise.resolve('cards'),
}));

describe('admin route loading states', () => {
  it('shows the HOA list header and skeleton', () => {
    render(<ApartmentsLoading />);

    expect(
      screen.getByRole('heading', { name: 'Wspólnoty mieszkaniowe' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('hoa-grid-skeleton')).toBeInTheDocument();
  });

  it('shows the settings header and skeleton', () => {
    const { container } = render(<SettingsLoading />);

    expect(
      screen.getByRole('heading', { name: 'Ustawienia' })
    ).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it.each([
    ['HOA apartments', HoaApartmentsLoading, 'apartment-list-skeleton'],
    [
      'apartment details',
      ApartmentDetailsLoading,
      'apartment-details-skeleton',
    ],
    ['users', UsersLoading, 'users-page-skeleton'],
  ])('%s shows its skeleton', async (_name, Loading, testId) => {
    render(await Loading());

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
