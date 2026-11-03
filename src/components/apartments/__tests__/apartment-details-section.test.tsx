import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApartmentDetailsSection } from '@/components/apartments/apartment-details-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  loadApartmentDetail: vi.fn(),
  content: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock(
  '@/app/api/admin/apartments/[apartmentId]/load-apartment-detail',
  () => ({ loadApartmentDetail: mocks.loadApartmentDetail })
);
vi.mock('@/components/apartments/apartment-details-content', () => ({
  ApartmentDetailsContent: (props: unknown) => {
    mocks.content(props);
    return <div>details</div>;
  },
}));

const params = Promise.resolve({ apartmentId: 'apt-1' });

describe('ApartmentDetailsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
  });

  it('renders the apartment loaded on the server', async () => {
    mocks.loadApartmentDetail.mockResolvedValue({ id: 'apt-1' });

    render(await ApartmentDetailsSection({ params }));

    expect(screen.getByText('details')).toBeInTheDocument();
    expect(mocks.content).toHaveBeenCalledWith({
      apartmentId: 'apt-1',
      initialApartment: { id: 'apt-1' },
    });
  });

  it('shows a message for an unknown apartment', async () => {
    mocks.loadApartmentDetail.mockResolvedValue(null);

    render(await ApartmentDetailsSection({ params }));

    expect(screen.getByText('Nie znaleziono mieszkania')).toBeInTheDocument();
  });

  it('does not load the apartment when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(ApartmentDetailsSection({ params })).rejects.toThrow(
      'NEXT_REDIRECT'
    );
    expect(mocks.loadApartmentDetail).not.toHaveBeenCalled();
  });
});
