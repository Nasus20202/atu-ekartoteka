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
    area: 5000,
    height: 250,
  };

  it('renders apartment basic information', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('ul. Testowa 1 10')).toBeInTheDocument();
    expect(screen.getByText('00-001 Warszawa')).toBeInTheDocument();
  });

  it('renders owner information when provided', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('Właściciel')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
  });

  it('renders building information when provided', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('Budynek')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders area in square meters', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('Powierzchnia')).toBeInTheDocument();
    expect(screen.getByText('50 m²')).toBeInTheDocument();
  });

  it('renders height in centimeters', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    expect(screen.getByText('Wysokość')).toBeInTheDocument();
    expect(screen.getByText('2.5 cm')).toBeInTheDocument();
  });

  it('renders link to apartment charges', () => {
    render(<ApartmentCard apartment={mockApartment} index={0} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard/charges/apt-1');

    const button = screen.getByRole('button', { name: /naliczenia/i });
    expect(button).toBeInTheDocument();
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
      area: null,
      height: null,
    };

    render(<ApartmentCard apartment={apartmentWithNulls} index={0} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('Właściciel')).not.toBeInTheDocument();
    expect(screen.queryByText('Budynek')).not.toBeInTheDocument();
    expect(screen.queryByText('Powierzchnia')).not.toBeInTheDocument();
    expect(screen.queryByText('Wysokość')).not.toBeInTheDocument();
  });

  it('applies animation delay based on index', () => {
    const { container } = render(
      <ApartmentCard apartment={mockApartment} index={2} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ animationDelay: '200ms' });
  });
});
