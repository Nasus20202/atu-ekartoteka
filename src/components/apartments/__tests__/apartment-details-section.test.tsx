import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { settlementsDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { ApartmentDetailsSection } from '@/components/apartments/apartment-details-section';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  loadApartmentDetail: vi.fn(),
  content: vi.fn(),
  findSettlements: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));

vi.mock('@/lib/framework/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/apartments/queries/load-apartment-detail', () => ({
  loadApartmentDetail: mocks.loadApartmentDetail,
}));
vi.mock('@/components/apartments/apartment-details-content', () => ({
  ApartmentDetailsContent: (props: { settlements?: ReactNode }) => {
    mocks.content(props);
    return <div>details{props.settlements}</div>;
  },
}));
vi.mock('@/lib/settlements/queries/find-admin-settlements', () => ({
  findAdminSettlements: mocks.findSettlements,
}));
vi.mock('@/components/settlements/admin-settlements-card', () => ({
  AdminSettlementsCard: (props: {
    apartmentLabel: string;
    hoaName: string;
  }) => (
    <div>
      settlements-card: {props.apartmentLabel}, {props.hoaName}
    </div>
  ),
}));

const APARTMENT = {
  id: 'apt-1',
  address: 'Lipowa',
  building: '5',
  number: '1',
  homeownersAssociation: { name: 'Wspólnota Testowa' },
};

const section = (query: Record<string, string> = {}) =>
  ApartmentDetailsSection({
    params: Promise.resolve({ apartmentId: 'apt-1' }),
    searchParams: Promise.resolve(query),
  });

const NO_SETTLEMENTS = settlementsDto({
  utilityPeriods: [],
  utility: null,
  readings: [],
  readingMeters: [],
  annualPeriods: [],
  annual: null,
});

describe('ApartmentDetailsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.loadApartmentDetail.mockResolvedValue(APARTMENT);
    mocks.findSettlements.mockResolvedValue(NO_SETTLEMENTS);
  });

  it('renders the apartment loaded on the server', async () => {
    render(await section());

    expect(screen.getByText('details')).toBeInTheDocument();
    expect(mocks.content).toHaveBeenCalledWith(
      expect.objectContaining({
        apartmentId: 'apt-1',
        initialApartment: APARTMENT,
      })
    );
    expect(screen.queryByText(/settlements-card/)).not.toBeInTheDocument();
  });

  it.each([
    ['utility', { utilityPeriods: settlementsDto().utilityPeriods }],
    ['annual', { annualPeriods: settlementsDto().annualPeriods }],
  ])('shows the card when there are %s settlements', async (_, periods) => {
    mocks.findSettlements.mockResolvedValue({ ...NO_SETTLEMENTS, ...periods });

    render(await section({ period: 'u1', year: 'r1' }));

    expect(mocks.findSettlements).toHaveBeenCalledWith('apt-1', {
      utilityId: 'u1',
      annualId: 'r1',
      readings: ALL_READINGS,
    });
    expect(
      screen.getByText('settlements-card: Lipowa 5/1, Wspólnota Testowa')
    ).toBeInTheDocument();
  });

  it('does not find a record of another apartment', async () => {
    mocks.findSettlements.mockResolvedValue(null);

    await expect(section({ period: 'other' })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });

  it('renders the not-found page for an unknown apartment', async () => {
    mocks.loadApartmentDetail.mockResolvedValue(null);

    await expect(section()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.content).not.toHaveBeenCalled();
  });

  it('does not load the apartment when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(section()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.loadApartmentDetail).not.toHaveBeenCalled();
    expect(mocks.findSettlements).not.toHaveBeenCalled();
  });
});
