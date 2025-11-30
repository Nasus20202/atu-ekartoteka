import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaymentsCard } from '@/components/dashboard/payments-card';

describe('PaymentsCard', () => {
  const mockPayment = {
    id: 'payment-1',
    externalId: 'EXT-PAY-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: 100.0,
    closingBalance: -500.0,
    januaryPayments: 500.0,
    februaryPayments: 500.0,
    marchPayments: 500.0,
    aprilPayments: 500.0,
    mayPayments: 500.0,
    junePayments: 500.0,
    julyPayments: 500.0,
    augustPayments: 500.0,
    septemberPayments: 500.0,
    octoberPayments: 500.0,
    novemberPayments: 500.0,
    decemberPayments: 500.0,
    apartmentId: 'apt-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Monthly charges (not used by the UI but required by the Payment type)
    januaryCharges: 0,
    februaryCharges: 0,
    marchCharges: 0,
    aprilCharges: 0,
    mayCharges: 0,
    juneCharges: 0,
    julyCharges: 0,
    augustCharges: 0,
    septemberCharges: 0,
    octoberCharges: 0,
    novemberCharges: 0,
    decemberCharges: 0,
  };

  it('should render payment year in title', () => {
    render(<PaymentsCard payment={mockPayment} />);
    expect(screen.getByText('Wpłaty 2024')).toBeInTheDocument();
  });

  it('should display date range', () => {
    render(<PaymentsCard payment={mockPayment} />);
    expect(screen.getByText(/okres:/i)).toBeInTheDocument();
  });

  it('should display opening balance', () => {
    render(<PaymentsCard payment={mockPayment} />);
    expect(screen.getByText('Saldo początkowe:')).toBeInTheDocument();
    expect(screen.getByText('100.00 zł')).toBeInTheDocument();
  });

  it('should calculate and display sum of payments', () => {
    render(<PaymentsCard payment={mockPayment} />);
    expect(screen.getByText('Suma wpłat:')).toBeInTheDocument();
    const paymentElements = screen.getAllByText('6000.00 zł');
    expect(paymentElements.length).toBeGreaterThan(0);
  });

  it('should display closing balance with negative value (green)', () => {
    render(<PaymentsCard payment={mockPayment} />);
    const closingBalanceElement = screen.getByText('-500.00 zł');
    expect(closingBalanceElement).toBeInTheDocument();
    expect(closingBalanceElement).toHaveClass('text-green-600');
  });

  it('should display closing balance with positive value (red)', () => {
    const payment = { ...mockPayment, closingBalance: 500.0 };
    const { container } = render(<PaymentsCard payment={payment} />);
    const closingBalanceElement = container.querySelector('.text-red-600');
    expect(closingBalanceElement).toBeInTheDocument();
    expect(closingBalanceElement?.textContent).toBe('500.00 zł');
  });

  it('should display closing balance with zero value (no color)', () => {
    const payment = { ...mockPayment, closingBalance: 0.0 };
    render(<PaymentsCard payment={payment} />);
    const closingBalanceElement = screen.getByText('0.00 zł');
    expect(closingBalanceElement).not.toHaveClass('text-green-600');
    expect(closingBalanceElement).not.toHaveClass('text-red-600');
  });

  it('should display all month names', () => {
    render(<PaymentsCard payment={mockPayment} />);

    const months = [
      'Styczeń',
      'Luty',
      'Marzec',
      'Kwiecień',
      'Maj',
      'Czerwiec',
      'Lipiec',
      'Sierpień',
      'Wrzesień',
      'Październik',
      'Listopad',
      'Grudzień',
    ];

    months.forEach((month) => {
      expect(screen.getByText(`${month}:`)).toBeInTheDocument();
    });
  });

  it('should display monthly payment amounts', () => {
    render(<PaymentsCard payment={mockPayment} />);
    const paymentElements = screen.getAllByText('500.00 zł');
    expect(paymentElements.length).toBeGreaterThan(0);
  });

  it('should format all amounts with two decimal places', () => {
    const payment = {
      ...mockPayment,
      openingBalance: 123.456,
      closingBalance: -45.678,
      januaryPayments: 99.994,
    };

    render(<PaymentsCard payment={payment} />);

    expect(screen.getByText('123.46 zł')).toBeInTheDocument();
    expect(screen.getByText('-45.68 zł')).toBeInTheDocument();
    expect(screen.getByText('99.99 zł')).toBeInTheDocument();
  });
});
