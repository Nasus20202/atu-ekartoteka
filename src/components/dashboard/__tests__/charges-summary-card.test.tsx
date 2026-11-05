import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { Prisma } from '@/generated/prisma/browser';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const CHART_RENDER_TIMEOUT_MS = 5000;

describe('ChargesSummaryCard', () => {
  const mockCharges = [
    { totalAmount: new Prisma.Decimal(100) },
    { totalAmount: new Prisma.Decimal(200) },
    { totalAmount: new Prisma.Decimal(300) },
  ];
  const trendData = [
    { period: '202412', label: 'Grudzień 2024', apt_test: 400 },
    { period: '202501', label: 'Styczeń 2025', apt_test: 600 },
  ];
  const trendSeries = [
    {
      key: 'apt_test',
      label: 'Test HOA',
      color: 'hsl(var(--primary))',
      apartmentId: 'apt-1',
    },
  ];

  it('renders the card title', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={0}
        currentMonthTotal={600}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByText('Naliczenia')).toBeInTheDocument();
  });

  it('displays current month charges when present', async () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={0}
        currentMonthTotal={600}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    // The chart draws its label after the card renders; allow for a slow machine
    await waitFor(
      () => expect(screen.getAllByText('Styczeń 2025')).toHaveLength(2),
      { timeout: CHART_RENDER_TIMEOUT_MS }
    );
    expect(screen.getByText('3 naliczenia')).toBeInTheDocument();
    expect(screen.getByText('600,00 zł')).toBeInTheDocument();
  });

  it('displays previous month charges when present', () => {
    const prevCharges = [{ totalAmount: new Prisma.Decimal(400) }];

    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={0}
        previousMonthCount={prevCharges.length}
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
        currentMonthCount={mockCharges.length}
        previousMonthCount={prevCharges.length}
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

  it('lets a single month use the full width', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={0}
        currentMonthTotal={600}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    const grid = screen.getByRole('link', {
      name: /Styczeń 2025/,
    }).parentElement;
    expect(grid?.className).not.toContain('sm:grid-cols-2');
  });

  it('puts two months side by side', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={mockCharges.length}
        currentMonthTotal={600}
        previousMonthTotal={600}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    const grid = screen.getByRole('link', {
      name: /Styczeń 2025/,
    }).parentElement;
    expect(grid?.className).toContain('sm:grid-cols-2');
  });

  it('links each recent month to its charges', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={mockCharges.length}
        currentMonthTotal={600}
        previousMonthTotal={600}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByRole('link', { name: /Styczeń 2025/ })).toHaveAttribute(
      'href',
      '/dashboard/charges?month=2025-01'
    );
    expect(screen.getByRole('link', { name: /Grudzień 2024/ })).toHaveAttribute(
      'href',
      '/dashboard/charges?month=2024-12'
    );
  });

  it('shows "Zobacz wszystkie naliczenia" button when charges exist', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={0}
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
        currentMonthCount={0}
        previousMonthCount={0}
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
        currentMonthCount={singleCharge.length}
        previousMonthCount={0}
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
        currentMonthCount={fiveCharges.length}
        previousMonthCount={0}
        currentMonthTotal={500}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByText('5 naliczeń')).toBeInTheDocument();
  });

  it('renders the recent charge trend chart when enough history exists', async () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={mockCharges.length}
        previousMonthCount={0}
        currentMonthTotal={600}
        previousMonthTotal={0}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(await screen.findByTestId('charge-trend-chart')).toBeInTheDocument();
  });

  it('renders the trend fallback when history is too short', async () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={0}
        previousMonthCount={0}
        currentMonthTotal={0}
        previousMonthTotal={0}
        trendData={[]}
        trendSeries={[]}
      />
    );

    expect(
      await screen.findByTestId('charge-trend-fallback')
    ).toBeInTheDocument();
  });

  it.each([
    [2, '2 naliczenia'],
    [5, '5 naliczeń'],
  ])('pluralises %i previous month charges', (count, label) => {
    render(
      <ChargesSummaryCard
        currentPeriod="202501"
        previousPeriod="202412"
        currentMonthCount={0}
        previousMonthCount={count}
        currentMonthTotal={0}
        previousMonthTotal={count}
        trendData={trendData}
        trendSeries={trendSeries}
      />
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
