import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { formatCurrency } from '@/lib/utils';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const amount = (value: number) => (_: string, element: Element | null) =>
  element?.tagName === 'SPAN' && element.textContent === formatCurrency(value);

const apartment = (
  id: string,
  closingBalance: number,
  withHistory = false
) => ({
  apartmentId: id,
  apartmentLabel: `Testowa 1/${id}`,
  hoaName: 'Wspólnota A',
  closingBalance,
  href: `/dashboard/payments/apt-${id}/2025`,
  history: withHistory
    ? [{ period: '202501', label: 'Styczeń 2025', balance: closingBalance }]
    : [],
});

describe('PaymentsSummaryCard', () => {
  it('renders nothing without apartment balances', () => {
    const { container } = render(
      <PaymentsSummaryCard apartmentBalances={[]} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a single apartment balance without a total', () => {
    render(<PaymentsSummaryCard apartmentBalances={[apartment('1', 120)]} />);

    expect(screen.getByText('Testowa 1/1')).toBeInTheDocument();
    expect(screen.getByText('Wspólnota A')).toBeInTheDocument();
    expect(screen.getByText(amount(120))).toHaveClass('text-green-600');
    expect(screen.queryByText('Łącznie')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Zobacz wszystkie wpłaty' })
    ).toHaveAttribute('href', '/dashboard/payments');
  });

  it('marks a negative balance in red', () => {
    render(<PaymentsSummaryCard apartmentBalances={[apartment('1', -50)]} />);

    expect(screen.getByText(amount(-50))).toHaveClass('text-red-600');
  });

  it('lists every apartment and the total for several apartments', () => {
    render(
      <PaymentsSummaryCard
        apartmentBalances={[apartment('1', 120), apartment('2', -150)]}
      />
    );

    expect(screen.getByText('Testowa 1/1')).toBeInTheDocument();
    expect(screen.getByText('Testowa 1/2')).toBeInTheDocument();
    expect(screen.getByText('Łącznie')).toBeInTheDocument();
    expect(screen.getByText(amount(-30))).toHaveClass('text-red-600');
  });

  it('links every apartment balance to its payments', () => {
    render(
      <PaymentsSummaryCard
        apartmentBalances={[apartment('1', 120), apartment('2', -30)]}
      />
    );

    expect(screen.getByRole('link', { name: /Testowa 1\/1/ })).toHaveAttribute(
      'href',
      '/dashboard/payments/apt-1/2025'
    );
    expect(screen.getByRole('link', { name: /Testowa 1\/2/ })).toHaveAttribute(
      'href',
      '/dashboard/payments/apt-2/2025'
    );
  });

  it('shows one combined balance chart for all apartments', () => {
    render(
      <PaymentsSummaryCard
        apartmentBalances={[
          apartment('1', 120, true),
          apartment('2', -30, true),
          apartment('3', 0),
        ]}
      />
    );

    expect(screen.getAllByTestId('balance-history-chart')).toHaveLength(1);
  });

  it('hides the balance chart without history', () => {
    render(<PaymentsSummaryCard apartmentBalances={[apartment('1', 120)]} />);

    expect(
      screen.queryByTestId('balance-history-chart')
    ).not.toBeInTheDocument();
  });
});
