import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApartmentChargesContent } from '@/components/charges/apartment-charges-content';
import { ApartmentChargesHeader } from '@/components/charges/apartment-charges-header';

const mocks = vi.hoisted(() => ({
  loadApartmentCharges: vi.fn(),
  getSortedPeriods: vi.fn(),
  display: vi.fn(),
}));

vi.mock('@/app/dashboard/charges/[apartmentId]/load-apartment-charges', () => ({
  loadApartmentCharges: mocks.loadApartmentCharges,
}));
vi.mock('@/app/dashboard/charges/charges-by-period', () => ({
  groupChargesByPeriod: () => ({ '2025-03': [] }),
  getSortedPeriods: mocks.getSortedPeriods,
  toActivePeriod: (month?: string) => month ?? null,
}));
vi.mock('@/components/charges/charges-display', () => ({
  ChargesDisplay: (props: unknown) => {
    mocks.display(props);
    return <div>charges</div>;
  },
}));
vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));
vi.mock('@/lib/utils/apartment-label', () => ({
  formatApartmentLabel: () => 'Długa 1/2',
}));

const params = Promise.resolve({ apartmentId: 'apt-1' });
const searchParams = (month?: string) => Promise.resolve({ month });
const apartment = {
  postalCode: '80-001',
  city: 'Gdańsk',
  charges: [],
  homeownersAssociation: { name: 'Wspólnota A' },
};

describe('apartment charges sections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadApartmentCharges.mockResolvedValue(apartment);
  });

  it('the header shows the apartment and its address', async () => {
    render(await ApartmentChargesHeader({ params }));

    expect(screen.getByText('Długa 1/2')).toBeInTheDocument();
    expect(screen.getByText('80-001 Gdańsk')).toBeInTheDocument();
  });

  it('the content shows the charges of the chosen month', async () => {
    mocks.getSortedPeriods.mockReturnValue(['2025-03']);

    render(
      await ApartmentChargesContent({
        params,
        searchParams: searchParams('2025-03'),
      })
    );

    expect(mocks.display).toHaveBeenCalledWith({
      periods: ['2025-03'],
      chargesByPeriod: { '2025-03': [] },
      activeMonth: '2025-03',
      apartmentLabel: 'Długa 1/2',
      hoaName: 'Wspólnota A',
    });
  });

  it('the content shows an empty state without charges', async () => {
    mocks.getSortedPeriods.mockReturnValue([]);

    render(
      await ApartmentChargesContent({ params, searchParams: searchParams() })
    );

    expect(screen.getByText('Brak naliczeń')).toBeInTheDocument();
    expect(mocks.display).not.toHaveBeenCalled();
  });
});
