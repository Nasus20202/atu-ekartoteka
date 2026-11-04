import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApartmentDetailsSection } from '@/components/apartments/apartment-details-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  loadApartmentDetail: vi.fn(),
  content: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/queries/apartments/load-apartment-detail', () => ({
  loadApartmentDetail: mocks.loadApartmentDetail,
}));
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

  it('renders the not-found page for an unknown apartment', async () => {
    mocks.loadApartmentDetail.mockResolvedValue(null);

    await expect(ApartmentDetailsSection({ params })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.content).not.toHaveBeenCalled();
  });

  it('does not load the apartment when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(ApartmentDetailsSection({ params })).rejects.toThrow(
      'NEXT_REDIRECT'
    );
    expect(mocks.loadApartmentDetail).not.toHaveBeenCalled();
  });
});
