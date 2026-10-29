import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import { AdminPaymentsList } from '@/components/payments/admin-payments-list';
import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
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

vi.mock('@/components/payments/payment-table', () => ({
  PaymentTable: ({ payment }: { payment: Payment }) => (
    <div data-testid={`payment-table-${payment.year}`}>{payment.year}</div>
  ),
}));

vi.mock('@/components/charts/payment-monthly-balance-chart', () => ({
  PaymentMonthlyBalanceChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="payment-monthly-chart">{data.length}</div>
  ),
}));

vi.mock('@/components/pdf/download-payment-pdf-button', () => ({
  DownloadPaymentPdfButton: () => <button>Download PDF</button>,
}));

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const baseProps = {
  apartmentId: 'apt-1',
  apartmentLabel: 'A/101',
  hoaName: 'Wspólnota Testowa',
};

describe('AdminPaymentsList', () => {
  describe('sumMonths', () => {
    it('displays correct total payments sum across all months', () => {
      const payment = createMockPayment({
        year: 2024,
        januaryPayments: 100,
        februaryPayments: 200,
        marchPayments: 150,
        // rest are 0
      });

      render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

      // "Suma wpłat:" row shows 450.00 zł
      expect(
        screen.getByText(withExactText(formatCurrency(450)))
      ).toBeInTheDocument();
    });

    it('displays correct total charges sum across all months', () => {
      const payment = createMockPayment({
        year: 2024,
        januaryCharges: 300,
        julyCharges: 200,
        decemberCharges: 100,
        // rest are 0
      });

      render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

      // "Naliczenie:" row shows 600.00 zł
      expect(
        screen.getByText(withExactText(formatCurrency(600)))
      ).toBeInTheDocument();
    });
  });

  describe('toSerializable', () => {
    it('renders payment without crashing when dates are Date objects', () => {
      const payment = createMockPayment({
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-15'),
      });

      render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

      // Component renders (PDF button uses serialized dates)
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('renders payment without crashing when dates are strings', () => {
      const payment = createMockPayment({
        // Prisma sometimes returns Date, but after JSON serialization they're strings
        dateFrom: '2024-01-01' as unknown as Date,
        dateTo: '2024-12-31' as unknown as Date,
        createdAt: '2024-01-01T00:00:00.000Z' as unknown as Date,
        updatedAt: '2024-06-15T00:00:00.000Z' as unknown as Date,
      });

      render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
  });

  it('renders a section per payment sorted by year descending', () => {
    const payments = [
      createMockPayment({ id: 'p-2023', year: 2023 }),
      createMockPayment({ id: 'p-2025', year: 2025 }),
      createMockPayment({ id: 'p-2024', year: 2024 }),
    ];

    render(<AdminPaymentsList {...baseProps} payments={payments} />);

    expect(screen.getByText('Rok 2025')).toBeInTheDocument();
    expect(screen.getByText('Rok 2024')).toBeInTheDocument();
    expect(screen.getByText('Rok 2023')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const yearButtons = buttons.filter((b) =>
      /Rok \d{4}/.test(b.textContent ?? '')
    );
    const years = yearButtons.map((b) =>
      parseInt(b.textContent?.match(/\d{4}/)?.[0] ?? '0')
    );
    expect(years[0]).toBeGreaterThan(years[1]);
    expect(years[1]).toBeGreaterThan(years[2]);
  });

  it('renders closing balance with correct color class for negative balance', () => {
    const payment = createMockPayment({
      closingBalance: new Prisma.Decimal(-150),
    });

    const { container } = render(
      <AdminPaymentsList {...baseProps} payments={[payment]} />
    );

    // The closing balance span should contain text-red-600
    const redSpans = container.querySelectorAll('.text-red-600');
    expect(redSpans.length).toBeGreaterThan(0);
    const hasNegative = Array.from(redSpans).some((el) =>
      el.textContent?.includes(formatCurrency(-150))
    );
    expect(hasNegative).toBe(true);
  });

  it('renders monthly chart inside the payment year section', () => {
    const payment = createMockPayment({
      januaryPayments: 100,
      januaryCharges: 50,
    });

    render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

    expect(
      screen.getByText('Wykres rozliczeń miesięcznych')
    ).toBeInTheDocument();
    expect(screen.getByTestId('payment-monthly-chart')).toBeInTheDocument();
  });

  it('colours balances by sign and opens the current year', () => {
    const currentYear = new Date().getFullYear();
    render(
      <AdminPaymentsList
        {...baseProps}
        payments={[
          createMockPayment({
            id: 'p-current',
            year: currentYear,
            openingBalance: new Prisma.Decimal(10),
            closingBalance: new Prisma.Decimal(5),
          }),
          createMockPayment({
            id: 'p-previous',
            year: currentYear - 1,
            openingBalance: new Prisma.Decimal(-3),
            closingBalance: new Prisma.Decimal(0),
          }),
        ]}
      />
    );

    const value = (label: string, index: number) =>
      screen.getAllByText(label)[index].nextElementSibling;

    expect(value('Saldo początkowe:', 0)).toHaveClass('text-green-600');
    expect(value('Saldo końcowe:', 0)).toHaveClass('text-green-600');
    expect(value('Saldo początkowe:', 1)).toHaveClass('text-red-600');
    expect(value('Saldo końcowe:', 1)).not.toHaveClass(
      'text-red-600',
      'text-green-600'
    );
    expect(document.querySelectorAll('.rotate-180')).toHaveLength(1);
  });
});
