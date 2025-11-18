import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';

describe('ChargesSummaryCard', () => {
  const mockCharges = [
    { totalAmount: 100 },
    { totalAmount: 200 },
    { totalAmount: 300 },
  ];

  it('renders the card title', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={mockCharges}
        previousMonthCharges={[]}
        currentMonthTotal={600}
        previousMonthTotal={0}
      />
    );

    expect(screen.getByText('Naliczenia')).toBeInTheDocument();
  });

  it('displays current month charges when present', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={mockCharges}
        previousMonthCharges={[]}
        currentMonthTotal={600}
        previousMonthTotal={0}
      />
    );

    expect(screen.getByText('Styczeń 2025')).toBeInTheDocument();
    expect(screen.getByText('3 naliczenia')).toBeInTheDocument();
    expect(screen.getByText('600,00 zł')).toBeInTheDocument();
  });

  it('displays previous month charges when present', () => {
    const prevCharges = [{ totalAmount: 400 }];

    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={[]}
        previousMonthCharges={prevCharges}
        currentMonthTotal={0}
        previousMonthTotal={400}
      />
    );

    expect(screen.getByText('Grudzień 2024')).toBeInTheDocument();
    expect(screen.getByText('1 naliczenie')).toBeInTheDocument();
    expect(screen.getByText('400,00 zł')).toBeInTheDocument();
  });

  it('displays both months when both have charges', () => {
    const prevCharges = [{ totalAmount: 400 }, { totalAmount: 500 }];

    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={mockCharges}
        previousMonthCharges={prevCharges}
        currentMonthTotal={600}
        previousMonthTotal={900}
      />
    );

    expect(screen.getByText('Styczeń 2025')).toBeInTheDocument();
    expect(screen.getByText('Grudzień 2024')).toBeInTheDocument();
    expect(screen.getByText('3 naliczenia')).toBeInTheDocument();
    expect(screen.getByText('2 naliczenia')).toBeInTheDocument();
  });

  it('shows "Zobacz wszystkie naliczenia" button when charges exist', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={mockCharges}
        previousMonthCharges={[]}
        currentMonthTotal={600}
        previousMonthTotal={0}
      />
    );

    const button = screen.getByRole('link', {
      name: /zobacz wszystkie naliczenia/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/dashboard/charges');
  });

  it('shows empty state when no charges exist', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={[]}
        previousMonthCharges={[]}
        currentMonthTotal={0}
        previousMonthTotal={0}
      />
    );

    expect(
      screen.getByText('Brak naliczeń dla ostatnich miesięcy.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /zobacz naliczenia/i })
    ).toBeInTheDocument();
  });

  it('uses correct plural forms for charge counts', () => {
    const singleCharge = [{ totalAmount: 100 }];
    const { rerender } = render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={singleCharge}
        previousMonthCharges={[]}
        currentMonthTotal={100}
        previousMonthTotal={0}
      />
    );

    expect(screen.getByText('1 naliczenie')).toBeInTheDocument();

    const fiveCharges = Array(5)
      .fill(null)
      .map(() => ({ totalAmount: 100 }));
    rerender(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={fiveCharges}
        previousMonthCharges={[]}
        currentMonthTotal={500}
        previousMonthTotal={0}
      />
    );

    expect(screen.getByText('5 naliczeń')).toBeInTheDocument();
  });
});
