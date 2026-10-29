import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import { PaymentTable } from '@/components/payments/payment-table';
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

describe('PaymentTable', () => {
  describe('running balance computation', () => {
    it('starts running balance from openingBalance and updates each month', () => {
      const payment = createMockPayment({
        openingBalance: 100,
        januaryPayments: 50,
        januaryCharges: 200,
        // running balance after Jan: 100 + 50 - 200 = -50
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      expect(
        screen.getAllByText(withExactText(formatCurrency(100))).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText(withExactText(formatCurrency(-50))).length
      ).toBeGreaterThanOrEqual(1);
    });

    it('accumulates balance across multiple months', () => {
      const payment = createMockPayment({
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

      expect(
        screen.getAllByText(withExactText(formatCurrency(-100))).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText(withExactText(formatCurrency(200))).length
      ).toBeGreaterThanOrEqual(1);
    });

    it('applies text-red-600 class for negative running balance', () => {
      const payment = createMockPayment({
        openingBalance: 0,
        januaryPayments: 0,
        januaryCharges: 100, // balance -100
      });

      const { container } = render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      const redCells = container.querySelectorAll('.text-red-600');
      const hasNegative = Array.from(redCells).some((el) =>
        el.textContent?.includes(formatCurrency(-100))
      );
      expect(hasNegative).toBe(true);
    });

    it('applies text-green-600 class for positive running balance', () => {
      const payment = createMockPayment({
        openingBalance: 0,
        januaryPayments: 100,
        januaryCharges: 0, // balance +100
      });

      const { container } = render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      const greenCells = container.querySelectorAll('.text-green-600');
      const hasPositive = Array.from(greenCells).some((el) =>
        el.textContent?.includes(formatCurrency(100))
      );
      expect(hasPositive).toBe(true);
    });
  });

  describe('month link generation', () => {
    it('renders links with correct href pattern when disableLinks is false', () => {
      const payment = createMockPayment({
        year: 2024,
        januaryPayments: new Prisma.Decimal(1),
      });

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
      const payment = createMockPayment({
        year: 2024,
        decemberPayments: new Prisma.Decimal(1),
      });

      render(<PaymentTable payment={payment} apartmentId="apt-42" />);

      const decLinks = screen
        .getAllByRole('link')
        .filter((l) => l.getAttribute('href')?.includes('2024-12'));
      expect(decLinks.length).toBeGreaterThan(0);
    });

    it('does not render links when disableLinks is true', () => {
      const payment = createMockPayment({
        year: 2024,
        januaryPayments: new Prisma.Decimal(1),
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-42" disableLinks />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('totals row', () => {
    it('renders correct total payments in the footer', () => {
      const payment = createMockPayment({
        januaryPayments: 100,
        marchPayments: 200,
        decemberPayments: 50,
        // Total: 350
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      expect(
        screen.getAllByText(withExactText(formatCurrency(350))).length
      ).toBeGreaterThanOrEqual(1);
    });

    it('renders correct total charges in the footer', () => {
      const payment = createMockPayment({
        februaryCharges: 300,
        novemberCharges: 100,
        // Total charges: 400
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      expect(
        screen.getAllByText(withExactText(formatCurrency(400))).length
      ).toBeGreaterThanOrEqual(1);
    });

    it('hides months where both payments and charges are zero', () => {
      const payment = createMockPayment({
        februaryPayments: new Prisma.Decimal(100),
      });

      render(
        <PaymentTable payment={payment} apartmentId="apt-1" disableLinks />
      );

      expect(screen.queryByText('Styczeń')).not.toBeInTheDocument();
      expect(screen.getByText('Luty')).toBeInTheDocument();
    });
  });

  it('colours opening and closing balances by their sign', () => {
    const { rerender } = render(
      <PaymentTable
        payment={createMockPayment({ openingBalance: -5, closingBalance: 7 })}
        apartmentId="apt-1"
        disableLinks
      />
    );

    expect(
      screen.getByText('Bilans otwarcia').parentElement?.lastChild
    ).toHaveClass('text-red-600');
    expect(screen.getByText(withExactText(formatCurrency(7)))).toHaveClass(
      'text-green-600'
    );

    rerender(
      <PaymentTable
        payment={createMockPayment({
          openingBalance: 3,
          closingBalance: -2,
          januaryPayments: 3,
          januaryCharges: 3,
        })}
        apartmentId="apt-1"
        disableLinks
      />
    );

    expect(
      screen.getByText('Bilans otwarcia').parentElement?.lastChild
    ).toHaveClass('text-green-600');
    expect(screen.getByText(withExactText(formatCurrency(-2)))).toHaveClass(
      'text-red-600'
    );
  });

  it('hides months after the charges data date', () => {
    render(
      <PaymentTable
        payment={createMockPayment({
          januaryPayments: 10,
          januaryCharges: 10,
          februaryCharges: 20,
        })}
        apartmentId="apt-1"
        disableLinks
        chargesDataDate="2024-01-31T00:00:00.000Z"
      />
    );

    expect(screen.getByText('Styczeń')).toBeInTheDocument();
    expect(screen.queryByText('Luty')).not.toBeInTheDocument();
  });
});
