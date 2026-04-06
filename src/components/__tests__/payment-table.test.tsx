import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentTable } from '@/components/payment-table';
import type { Payment } from '@/lib/types';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: 0,
    closingBalance: 0,
    openingDebt: 0,
    openingSurplus: 0,
    januaryPayments: 0,
    februaryPayments: 0,
    marchPayments: 0,
    aprilPayments: 0,
    mayPayments: 0,
    junePayments: 0,
    julyPayments: 0,
    augustPayments: 0,
    septemberPayments: 0,
    octoberPayments: 0,
    novemberPayments: 0,
    decemberPayments: 0,
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('PaymentTable', () => {
  describe('running balance computation', () => {
    it('starts running balance from openingBalance and updates each month', () => {
      const payment = makePayment({
        openingBalance: 100,
        januaryPayments: 50,
        januaryCharges: 200,
        // running balance after Jan: 100 + 50 - 200 = -50
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      // Opening balance 100.00 zł appears in the balance cell
      expect(screen.getAllByText('100.00 zł').length).toBeGreaterThanOrEqual(1);
      // After January: -50.00 zł
      expect(screen.getAllByText('-50.00 zł').length).toBeGreaterThanOrEqual(1);
    });

    it('accumulates balance across multiple months', () => {
      const payment = makePayment({
        openingBalance: 0,
        januaryPayments: 100,
        januaryCharges: 0, // +100 → balance = 100
        februaryPayments: 0,
        februaryCharges: 200, // -200 → balance = -100
        marchPayments: 300,
        marchCharges: 0, // +300 → balance = 200
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      // Feb balance is -100.00 zł
      expect(screen.getAllByText('-100.00 zł').length).toBeGreaterThanOrEqual(
        1
      );
      // March balance is 200.00 zł
      expect(screen.getAllByText('200.00 zł').length).toBeGreaterThanOrEqual(1);
    });

    it('applies text-red-600 class for negative running balance', () => {
      const payment = makePayment({
        openingBalance: 0,
        januaryPayments: 0,
        januaryCharges: 100, // balance -100
      });

      const { container } = render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      const redCells = container.querySelectorAll('.text-red-600');
      const hasNegative = Array.from(redCells).some((el) =>
        el.textContent?.includes('-100.00')
      );
      expect(hasNegative).toBe(true);
    });

    it('applies text-green-600 class for positive running balance', () => {
      const payment = makePayment({
        openingBalance: 0,
        januaryPayments: 100,
        januaryCharges: 0, // balance +100
      });

      const { container } = render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      const greenCells = container.querySelectorAll('.text-green-600');
      const hasPositive = Array.from(greenCells).some((el) =>
        el.textContent?.includes('100.00')
      );
      expect(hasPositive).toBe(true);
    });
  });

  describe('month link generation', () => {
    it('renders links with correct href pattern when disableLinks is false', () => {
      const payment = makePayment({ year: 2024 });

      render(<PaymentTable payment={payment} apartmentId="apt-42" />);

      const links = screen.getAllByRole('link');
      // January link: /dashboard/charges/apt-42?month=2024-01
      const janLinks = links.filter((l) =>
        l.getAttribute('href')?.includes('2024-01')
      );
      expect(janLinks.length).toBeGreaterThan(0);
      expect(janLinks[0]).toHaveAttribute(
        'href',
        '/dashboard/charges/apt-42?month=2024-01'
      );
    });

    it('renders December link with month=2024-12', () => {
      const payment = makePayment({ year: 2024 });

      render(<PaymentTable payment={payment} apartmentId="apt-42" />);

      const decLinks = screen
        .getAllByRole('link')
        .filter((l) => l.getAttribute('href')?.includes('2024-12'));
      expect(decLinks.length).toBeGreaterThan(0);
    });

    it('does not render links when disableLinks is true', () => {
      const payment = makePayment({ year: 2024 });

      render(
        <PaymentTable payment={payment} apartmentId="apt-42" disableLinks />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('totals row', () => {
    it('renders correct total payments in the footer', () => {
      const payment = makePayment({
        januaryPayments: 100,
        marchPayments: 200,
        decemberPayments: 50,
        // Total: 350
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      // The footer total payments cell: "350.00 zł"
      expect(screen.getAllByText('350.00 zł').length).toBeGreaterThanOrEqual(1);
    });

    it('renders correct total charges in the footer', () => {
      const payment = makePayment({
        februaryCharges: 300,
        novemberCharges: 100,
        // Total charges: 400
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      expect(screen.getAllByText('400.00 zł').length).toBeGreaterThanOrEqual(1);
    });
  });
});
