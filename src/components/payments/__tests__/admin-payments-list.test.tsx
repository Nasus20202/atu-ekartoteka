import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminPaymentsList } from '@/components/payments/admin-payments-list';
import type { Payment } from '@/lib/types';

vi.mock('@/components/payment-table', () => ({
  PaymentTable: ({ payment }: { payment: Payment }) => (
    <div data-testid={`payment-table-${payment.year}`}>{payment.year}</div>
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

const baseProps = {
  apartmentId: 'apt-1',
  apartmentLabel: 'A/101',
  hoaName: 'Wspólnota Testowa',
};

describe('AdminPaymentsList', () => {
  describe('sumMonths', () => {
    it('displays correct total payments sum across all months', () => {
      const payment = makePayment({
        year: 2024,
        januaryPayments: 100,
        februaryPayments: 200,
        marchPayments: 150,
        // rest are 0
      });

      render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

      // "Suma wpłat:" row shows 450.00 zł
      expect(screen.getByText('450.00 zł')).toBeInTheDocument();
    });

    it('displays correct total charges sum across all months', () => {
      const payment = makePayment({
        year: 2024,
        januaryCharges: 300,
        julyCharges: 200,
        decemberCharges: 100,
        // rest are 0
      });

      render(<AdminPaymentsList {...baseProps} payments={[payment]} />);

      // "Naliczenie:" row shows 600.00 zł
      expect(screen.getByText('600.00 zł')).toBeInTheDocument();
    });
  });

  describe('toSerializable', () => {
    it('renders payment without crashing when dates are Date objects', () => {
      const payment = makePayment({
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
      const payment = makePayment({
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
      makePayment({ id: 'p-2023', year: 2023 }),
      makePayment({ id: 'p-2025', year: 2025 }),
      makePayment({ id: 'p-2024', year: 2024 }),
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
    const payment = makePayment({ closingBalance: -150 });

    const { container } = render(
      <AdminPaymentsList {...baseProps} payments={[payment]} />
    );

    // The closing balance span should contain text-red-600
    const redSpans = container.querySelectorAll('.text-red-600');
    expect(redSpans.length).toBeGreaterThan(0);
    const hasNegative = Array.from(redSpans).some((el) =>
      el.textContent?.includes('-150.00')
    );
    expect(hasNegative).toBe(true);
  });
});
