import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApartmentCard } from '@/components/dashboard/apartment-card';

describe('ApartmentCard', () => {
  const mockApartment = {
    id: 'apt-1',
    address: 'ul. Testowa 1',
    number: '10',
    postalCode: '00-001',
    city: 'Warszawa',
    owner: 'Jan Kowalski',
    building: 'A',
    shareNumerator: 5000,
    shareDenominator: 250,
  };

  it('renders apartment basic information', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText(/ul\. Testowa 1 A\/10/)).toBeInTheDocument();
    expect(screen.getByText('00-001 Warszawa')).toBeInTheDocument();
  });

  it('renders owner information when provided', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('Właściciel')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
  });

  it('renders building in address when provided', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText(/A\/10/)).toBeInTheDocument();
  });

  it('renders area in square meters', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('Udział')).toBeInTheDocument();
    expect(screen.getByText('2000.0%')).toBeInTheDocument();
  });

  it('renders links to apartment charges and payments when data is available', () => {
    render(
      <ApartmentCard
        apartment={mockApartment}
        hasCharges={true}
        hasPayments={true}
        index={0}
      />
    );

    const chargesLink = screen.getByRole('link', { name: /naliczenia/i });
    expect(chargesLink).toHaveAttribute('href', '/dashboard/charges/apt-1');

    const paymentsLink = screen.getByRole('link', { name: /wpłaty/i });
    expect(paymentsLink).toHaveAttribute(
      'href',
      `/dashboard/payments/apt-1/${new Date().getFullYear()}`
    );
  });

  it('hides payment button when no payments are available', () => {
    render(
      <ApartmentCard
        apartment={mockApartment}
        hasCharges={true}
        hasPayments={false}
        index={0}
      />
    );

    expect(
      screen.queryByRole('link', { name: /wpłaty/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /naliczenia/i })
    ).toBeInTheDocument();
  });

  it('hides charges button when no charges are available', () => {
    render(
      <ApartmentCard
        apartment={mockApartment}
        hasCharges={false}
        hasPayments={true}
        index={0}
      />
    );

    expect(
      screen.queryByRole('link', { name: /naliczenia/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /wpłaty/i })).toBeInTheDocument();
  });

  it('hides both buttons when no data is available', () => {
    render(
      <ApartmentCard
        apartment={mockApartment}
        hasCharges={false}
        hasPayments={false}
        index={0}
      />
    );

    expect(
      screen.queryByRole('link', { name: /naliczenia/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /wpłaty/i })
    ).not.toBeInTheDocument();
  });

  it('handles null values gracefully', () => {
    const apartmentWithNulls = {
      id: 'apt-2',
      address: null,
      number: '5',
      postalCode: null,
      city: null,
      owner: null,
      building: null,
      shareNumerator: null,
      shareDenominator: null,
    };

    render(<ApartmentCard apartment={apartmentWithNulls} index={0} />);

    expect(screen.getByText(/\/5/)).toBeInTheDocument();
    expect(screen.queryByText('Właściciel')).not.toBeInTheDocument();
    expect(screen.queryByText('Udział')).not.toBeInTheDocument();
  });

  it('applies animation delay based on index', () => {
    const { container } = render(
      <ApartmentCard apartment={mockApartment} index={2} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ animationDelay: '200ms' });
  });
});
