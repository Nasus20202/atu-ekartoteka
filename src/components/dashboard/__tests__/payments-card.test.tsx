import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaymentsCard } from '@/components/dashboard/payments-card';
import { Prisma } from '@/generated/prisma/browser';
import { formatCurrency } from '@/lib/utils';

const withExactText =
  (value: string) => (_: string, element: Element | null) => {
    if (!element) {
      return false;
    }

    return (
      element.textContent === value &&
      Array.from(element.children).every((child) => child.textContent !== value)
    );
  };

describe('PaymentsCard', () => {
  const mockPayment = {
    id: 'payment-1',
    externalId: 'EXT-PAY-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: new Prisma.Decimal(100),
    closingBalance: new Prisma.Decimal(-500),
    openingDebt: new Prisma.Decimal(0),
    openingSurplus: new Prisma.Decimal(0),
    januaryPayments: new Prisma.Decimal(500),
    februaryPayments: new Prisma.Decimal(500),
    marchPayments: new Prisma.Decimal(500),
    aprilPayments: new Prisma.Decimal(500),
    mayPayments: new Prisma.Decimal(500),
    junePayments: new Prisma.Decimal(500),
    julyPayments: new Prisma.Decimal(500),
    augustPayments: new Prisma.Decimal(500),
    septemberPayments: new Prisma.Decimal(500),
    octoberPayments: new Prisma.Decimal(500),
    novemberPayments: new Prisma.Decimal(500),
    decemberPayments: new Prisma.Decimal(500),
    apartmentId: 'apt-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Monthly charges (not used by the UI but required by the Payment type)
    januaryCharges: new Prisma.Decimal(0),
    februaryCharges: new Prisma.Decimal(0),
    marchCharges: new Prisma.Decimal(0),
    aprilCharges: new Prisma.Decimal(0),
    mayCharges: new Prisma.Decimal(0),
    juneCharges: new Prisma.Decimal(0),
    julyCharges: new Prisma.Decimal(0),
    augustCharges: new Prisma.Decimal(0),
    septemberCharges: new Prisma.Decimal(0),
    octoberCharges: new Prisma.Decimal(0),
    novemberCharges: new Prisma.Decimal(0),
    decemberCharges: new Prisma.Decimal(0),
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
    expect(
      screen.getByText(withExactText(formatCurrency(100)))
    ).toBeInTheDocument();
  });

  it('should calculate and display sum of payments', () => {
    render(<PaymentsCard payment={mockPayment} />);
    expect(screen.getByText('Suma wpłat:')).toBeInTheDocument();
    const paymentElements = screen.getAllByText(
      withExactText(formatCurrency(6000))
    );
    expect(paymentElements.length).toBeGreaterThan(0);
  });

  it('should display closing balance with negative value (red)', () => {
    render(<PaymentsCard payment={mockPayment} />);
    const closingBalanceElement = screen.getByText(
      withExactText(formatCurrency(-500))
    );
    expect(closingBalanceElement).toBeInTheDocument();
    expect(closingBalanceElement).toHaveClass('text-red-600');
  });

  it('should display closing balance with positive value (green)', () => {
    const payment = {
      ...mockPayment,
      closingBalance: new Prisma.Decimal(500),
    };
    const { container } = render(<PaymentsCard payment={payment} />);
    const closingBalanceElement = container.querySelector('.text-green-600');
    expect(closingBalanceElement).toBeInTheDocument();
    expect(closingBalanceElement?.textContent).toBe(formatCurrency(500));
  });

  it('should display closing balance with zero value (no color)', () => {
    const payment = {
      ...mockPayment,
      closingBalance: new Prisma.Decimal(0),
    };
    render(<PaymentsCard payment={payment} />);
    const closingBalanceElement = screen.getByText(
      withExactText(formatCurrency(0))
    );
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
    const paymentElements = screen.getAllByText(
      withExactText(formatCurrency(500))
    );
    expect(paymentElements.length).toBeGreaterThan(0);
  });

  it('should format all amounts with two decimal places', () => {
    const payment = {
      ...mockPayment,
      openingBalance: new Prisma.Decimal('123.4560'),
      closingBalance: new Prisma.Decimal('-45.6780'),
      januaryPayments: new Prisma.Decimal('99.9940'),
    };

    render(<PaymentsCard payment={payment} />);

    expect(
      screen.getByText(withExactText(formatCurrency('123.456')))
    ).toBeInTheDocument();
    expect(
      screen.getByText(withExactText(formatCurrency('-45.678')))
    ).toBeInTheDocument();
    expect(
      screen.getByText(withExactText(formatCurrency('99.994')))
    ).toBeInTheDocument();
  });

  it('hides empty months', () => {
    const payment = {
      ...mockPayment,
      februaryPayments: new Prisma.Decimal(0),
      februaryCharges: new Prisma.Decimal(0),
    };

    render(<PaymentsCard payment={payment} />);

    expect(screen.queryByText('Luty:')).not.toBeInTheDocument();
  });
});
