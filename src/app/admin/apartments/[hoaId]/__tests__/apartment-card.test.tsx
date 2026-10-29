import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createMockApartment } from '@/__tests__/fixtures';
import { ApartmentCard } from '@/app/admin/apartments/[hoaId]/apartment-card';

const apartment = createMockApartment({
  shareNumerator: 25,
  shareDenominator: 1000,
});

describe('ApartmentCard', () => {
  it('shows the address, owner, share and details link', () => {
    render(
      <ApartmentCard apartment={apartment} hoaId="hoa1" isDuplicate={false} />
    );

    expect(screen.getByText('Main Street 1 A/101')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('Aktywne')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/admin/apartments/hoa1/apt1'
    );
    expect(screen.queryByText('Duplikat adresu')).not.toBeInTheDocument();
  });

  it('marks inactive and duplicate apartments', () => {
    render(
      <ApartmentCard
        apartment={{ ...apartment, isActive: false }}
        hoaId="hoa1"
        isDuplicate
      />
    );

    expect(screen.getByText('Nieaktywne')).toBeInTheDocument();
    expect(screen.getByText('Duplikat adresu')).toBeInTheDocument();
  });

  it('shows a dash for an incomplete share and hides a missing one', () => {
    const { rerender } = render(
      <ApartmentCard
        apartment={{ ...apartment, shareDenominator: null }}
        hoaId="hoa1"
        isDuplicate={false}
      />
    );
    expect(screen.getByText('-')).toBeInTheDocument();

    rerender(
      <ApartmentCard
        apartment={{
          ...apartment,
          shareNumerator: null,
          shareDenominator: null,
        }}
        hoaId="hoa1"
        isDuplicate={false}
      />
    );
    expect(screen.queryByText('Udział:')).not.toBeInTheDocument();
  });
});
