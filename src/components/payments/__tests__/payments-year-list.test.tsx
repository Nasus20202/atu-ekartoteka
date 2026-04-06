import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentsYearList } from '@/components/payments/payments-year-list';

vi.mock('@/components/payments/payment-year-row', () => ({
  PaymentYearRow: ({
    payment,
    apartmentLabel,
  }: {
    payment: { year: number; id: string };
    apartmentLabel: string;
  }) => (
    <div data-testid={`payment-row-${payment.year}`}>
      {apartmentLabel} - {payment.year}
    </div>
  ),
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

function makePaymentEntry(year: number, id = `payment-${year}`) {
  return {
    payment: {
      id,
      year,
      closingBalance: 100,
      openingBalance: 0,
      openingSurplus: 0,
      openingDebt: 0,
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
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      apartmentId: 'apt-1',
    },
    apartmentId: 'apt-1',
    apartmentLabel: 'A/101',
    hoaName: 'Wspólnota Testowa',
    dateFromLabel: '01.01.2025',
    dateToLabel: '31.12.2025',
  };
}

describe('PaymentsYearList — groupByYear', () => {
  it('renders year section headers for each unique year', () => {
    const payments = [
      makePaymentEntry(2025),
      makePaymentEntry(2024, 'payment-2024'),
    ];

    render(<PaymentsYearList payments={payments} />);

    expect(screen.getByText('Rok 2025')).toBeInTheDocument();
    expect(screen.getByText('Rok 2024')).toBeInTheDocument();
  });

  it('renders years in descending order', () => {
    const payments = [
      makePaymentEntry(2023, 'p-2023'),
      makePaymentEntry(2025, 'p-2025'),
      makePaymentEntry(2024, 'p-2024'),
    ];

    render(<PaymentsYearList payments={payments} />);

    const yearButtons = screen.getAllByRole('button');
    const yearTexts = yearButtons.map((b) => b.textContent ?? '');
    const year2025Idx = yearTexts.findIndex((t) => t.includes('2025'));
    const year2024Idx = yearTexts.findIndex((t) => t.includes('2024'));
    const year2023Idx = yearTexts.findIndex((t) => t.includes('2023'));

    expect(year2025Idx).toBeLessThan(year2024Idx);
    expect(year2024Idx).toBeLessThan(year2023Idx);
  });

  it('groups multiple payments of the same year together', () => {
    const payments = [
      makePaymentEntry(2025, 'p-2025-a'),
      makePaymentEntry(2025, 'p-2025-b'),
    ];

    render(<PaymentsYearList payments={payments} />);

    // Only one "Rok 2025" header
    expect(screen.getAllByText('Rok 2025')).toHaveLength(1);
    // Both payment rows rendered under that one year group
    expect(screen.getAllByTestId('payment-row-2025')).toHaveLength(2);
  });

  it('renders nothing when payments list is empty', () => {
    const { container } = render(<PaymentsYearList payments={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
