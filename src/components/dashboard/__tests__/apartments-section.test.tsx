import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApartmentsSection } from '@/components/dashboard/apartments-section';

describe('ApartmentsSection', () => {
  const mockApartments = [
    {
      id: 'apt-1',
      address: 'ul. Testowa 1',
      number: '10',
      postalCode: '00-001',
      city: 'Warszawa',
      owner: 'Jan Kowalski',
      building: 'A',
      area: 5000,
      height: 250,
    },
    {
      id: 'apt-2',
      address: 'ul. Testowa 2',
      number: '20',
      postalCode: '00-002',
      city: 'Kraków',
      owner: 'Anna Nowak',
      building: 'B',
      area: 6000,
      height: 280,
    },
  ];

  it('renders section with apartments', () => {
    render(<ApartmentsSection apartments={mockApartments} />);

    expect(screen.getByText('Mieszkania (2)')).toBeInTheDocument();
    expect(screen.getByText('ul. Testowa 1 10')).toBeInTheDocument();
    expect(screen.getByText('ul. Testowa 2 20')).toBeInTheDocument();
  });

  it('renders singular title for one apartment', () => {
    render(<ApartmentsSection apartments={[mockApartments[0]]} />);

    expect(screen.getByText('Mieszkanie')).toBeInTheDocument();
  });

  it('renders title for no apartments', () => {
    render(<ApartmentsSection apartments={[]} />);

    expect(screen.getByText('Mieszkanie')).toBeInTheDocument();
  });

  it('renders empty state when no apartments', () => {
    render(<ApartmentsSection apartments={[]} />);

    expect(
      screen.getByText('Brak przypisanego mieszkania')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/administrator jeszcze nie przypisał ci mieszkania/i)
    ).toBeInTheDocument();
  });

  it('renders all apartment cards', () => {
    render(<ApartmentsSection apartments={mockApartments} />);

    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getAllByText('Właściciel')).toHaveLength(2);
  });

  it('has Building2 icon', () => {
    const { container } = render(
      <ApartmentsSection apartments={mockApartments} />
    );

    const icon = container.querySelector('svg.lucide-building-2');
    expect(icon).toBeInTheDocument();
  });
});
