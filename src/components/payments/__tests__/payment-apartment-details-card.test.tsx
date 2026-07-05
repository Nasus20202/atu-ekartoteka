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
    shareNumerator: 575,
    shareDenominator: 10000,
  };

  it('renders apartment address', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} />);

    expect(screen.getByText('ul. Testowa 1 A/10')).toBeInTheDocument();
  });

  it('renders share percentage without trailing zeros', () => {
    render(<PaymentApartmentDetailsCard {...defaultProps} />);

    expect(screen.getByText('5.75%')).toBeInTheDocument();
  });

  it('renders share as integer when calculation yields round number', () => {
    render(
      <PaymentApartmentDetailsCard
        {...defaultProps}
        shareNumerator={5000}
        shareDenominator={250}
      />
    );

    expect(screen.getByText('2000%')).toBeInTheDocument();
  });

  it('handles null numerator by showing dash', () => {
    render(
      <PaymentApartmentDetailsCard
        {...defaultProps}
        shareNumerator={null}
        shareDenominator={250}
      />
    );

    expect(screen.getByText('-%')).toBeInTheDocument();
  });

  it('handles null denominator by showing dash', () => {
    render(
      <PaymentApartmentDetailsCard
        {...defaultProps}
        shareNumerator={5000}
        shareDenominator={null}
      />
    );

    expect(screen.getByText('-%')).toBeInTheDocument();
  });

  it('handles zero denominator by showing dash', () => {
    render(
      <PaymentApartmentDetailsCard
        {...defaultProps}
        shareNumerator={5000}
        shareDenominator={0}
      />
    );

    expect(screen.getByText('-%')).toBeInTheDocument();
  });
});
