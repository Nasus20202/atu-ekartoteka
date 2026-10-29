import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { formatCurrency } from '@/lib/utils';

const amount = (value: number) => (_: string, element: Element | null) =>
  element?.tagName === 'SPAN' && element.textContent === formatCurrency(value);

const group = (hoaId: string, totalClosingBalance: number) => ({
  hoaId,
  hoaName: `Wspólnota ${hoaId}`,
  totalClosingBalance,
});

describe('PaymentsSummaryCard', () => {
  it('renders nothing without HOA groups', () => {
    const { container } = render(<PaymentsSummaryCard hoaGroups={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a single HOA balance', () => {
    render(<PaymentsSummaryCard hoaGroups={[group('1', 120)]} />);

    expect(screen.getByText('Wspólnota 1')).toBeInTheDocument();
    expect(screen.getByText(amount(120))).toHaveClass('text-green-600');
    expect(screen.queryByText('Łącznie')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Zobacz wszystkie wpłaty' })
    ).toHaveAttribute('href', '/dashboard/payments');
  });

  it('marks a negative single balance in red', () => {
    render(<PaymentsSummaryCard hoaGroups={[group('1', -5)]} />);

    expect(screen.getByText(amount(-5))).toHaveClass('text-red-600');
  });

  it('lists every HOA and the total for several groups', () => {
    render(
      <PaymentsSummaryCard hoaGroups={[group('1', 100), group('2', -150)]} />
    );

    expect(screen.getByText(amount(100))).toHaveClass('text-green-600');
    expect(screen.getByText(amount(-150))).toHaveClass('text-red-600');
    expect(screen.getByText('Łącznie')).toBeInTheDocument();
    expect(screen.getByText(amount(-50))).toHaveClass('text-red-600');
  });

  it('shows a non-negative total in green', () => {
    render(
      <PaymentsSummaryCard hoaGroups={[group('1', 100), group('2', 0)]} />
    );

    expect(screen.getByText(amount(100), { selector: '.text-xl' })).toHaveClass(
      'text-green-600'
    );
  });
});
