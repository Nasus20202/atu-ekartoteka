import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaymentApartmentDetailsCard } from '@/components/payments/payment-apartment-details-card';

describe('PaymentApartmentDetailsCard', () => {
  const defaultProps = {
    address: 'ul. Testowa 1',
    building: 'A',
    number: '10',
    postalCode: '00-001',
    city: 'Warszawa',
    shareRatio: 0.0575,
  };

  it('renders apartment address', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} />);

    expect(screen.getByText('ul. Testowa 1 A/10')).toBeInTheDocument();
  });

  it('renders the address without a building', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} building={null} />);

    expect(screen.getByText(/^ul\. Testowa 1\s+\/10$/)).toBeInTheDocument();
  });

  it('renders share percentage without trailing zeros', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} />);

    expect(screen.getByText('5,75%')).toBeInTheDocument();
  });

  it('renders share as integer when calculation yields round number', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} shareRatio={20} />);

    expect(screen.getByText('2000%')).toBeInTheDocument();
  });

  it('shows a dash when the share is unknown', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} shareRatio={null} />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText('-%')).not.toBeInTheDocument();
  });
});
