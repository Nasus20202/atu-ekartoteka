import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { Prisma } from '@/generated/prisma/browser';

describe('ChargesSummaryCard', () => {
  const mockCharges = [
    { totalAmount: new Prisma.Decimal(100) },
    { totalAmount: new Prisma.Decimal(200) },
    { totalAmount: new Prisma.Decimal(300) },
  ];
  const trendData = [
    { period: '202412', label: 'Grudzień 2024', hoa_test: 400 },
    { period: '202501', label: 'Styczeń 2025', hoa_test: 600 },
  ];
  const trendSeries = [
    { key: 'hoa_test', label: 'Test HOA', color: 'hsl(var(--primary))' },
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
        trendData={trendData}
        trendSeries={trendSeries}
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
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getAllByText('Styczeń 2025')[1]).toBeInTheDocument();
    expect(screen.getByText('3 naliczenia')).toBeInTheDocument();
    expect(screen.getByText('600,00 zł')).toBeInTheDocument();
  });

  it('displays previous month charges when present', () => {
    const prevCharges = [{ totalAmount: new Prisma.Decimal(400) }];

    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={[]}
        previousMonthCharges={prevCharges}
        currentMonthTotal={0}
        previousMonthTotal={400}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByText('Grudzień 2024')).toBeInTheDocument();
    expect(screen.getByText('1 naliczenie')).toBeInTheDocument();
    expect(screen.getByText('400,00 zł')).toBeInTheDocument();
  });

  it('displays both months when both have charges', () => {
    const prevCharges = [
      { totalAmount: new Prisma.Decimal(400) },
      { totalAmount: new Prisma.Decimal(500) },
    ];

    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={mockCharges}
        previousMonthCharges={prevCharges}
        currentMonthTotal={600}
        previousMonthTotal={900}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getAllByText('Styczeń 2025').at(-1)).toBeInTheDocument();
    expect(screen.getAllByText('Grudzień 2024').at(-1)).toBeInTheDocument();
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
        trendData={trendData}
        trendSeries={trendSeries}
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
        trendData={[]}
        trendSeries={[]}
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
    const singleCharge = [{ totalAmount: new Prisma.Decimal(100) }];
    const { rerender } = render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={singleCharge}
        previousMonthCharges={[]}
        currentMonthTotal={100}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByText('1 naliczenie')).toBeInTheDocument();

    const fiveCharges = Array(5)
      .fill(null)
      .map(() => ({ totalAmount: new Prisma.Decimal(100) }));
    rerender(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={fiveCharges}
        previousMonthCharges={[]}
        currentMonthTotal={500}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByText('5 naliczeń')).toBeInTheDocument();
  });

  it('renders the recent charge trend chart when enough history exists', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={mockCharges}
        previousMonthCharges={[]}
        currentMonthTotal={600}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByTestId('charge-trend-chart')).toBeInTheDocument();
  });

  it('renders the trend fallback when history is too short', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCharges={[]}
        previousMonthCharges={[]}
        currentMonthTotal={0}
        previousMonthTotal={0}
        trendData={[]}
        trendSeries={[]}
      />
    );

    expect(screen.getByTestId('charge-trend-fallback')).toBeInTheDocument();
  });
});
