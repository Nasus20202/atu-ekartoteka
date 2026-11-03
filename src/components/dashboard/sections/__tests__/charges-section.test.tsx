import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChargesSection } from '@/components/dashboard/sections/charges-section';
import { Prisma } from '@/generated/prisma/browser';

const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  apartments: vi.fn(),
  totals: vi.fn(),
  card: vi.fn(),
}));

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: () => mocks.account(),
  loadApartmentsWithCharges: () => mocks.apartments(),
  loadPeriodTotals: () => mocks.totals(),
  loadDashboardContext: () =>
    Promise.resolve({ currentPeriod: '202611', previousPeriod: '202610' }),
}));
vi.mock('@/components/charts/chart-data', () => ({
  getChargeTrendByApartment: () => ({ data: [], series: [] }),
}));
vi.mock('@/components/dashboard/charges-summary-card', () => ({
  ChargesSummaryCard: (props: unknown) => {
    mocks.card(props);
    return <div>Naliczenia</div>;
  },
}));

describe('ChargesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ status: 'APPROVED' });
    mocks.apartments.mockResolvedValue([{ id: 'apt-1', charges: [] }]);
    mocks.totals.mockResolvedValue(
      new Map([['202611', { count: 4, total: new Prisma.Decimal(800) }]])
    );
  });

  it('passes the database counts and totals to the summary card', async () => {
    render(await ChargesSection());

    expect(screen.getByText('Naliczenia')).toBeInTheDocument();
    expect(mocks.card.mock.calls[0][0]).toMatchObject({
      currentMonthCount: 4,
      currentMonthTotal: new Prisma.Decimal(800),
      previousMonthCount: 0,
    });
  });

  it('renders nothing for a pending user', async () => {
    mocks.account.mockResolvedValue({ status: 'PENDING' });

    expect(await ChargesSection()).toBeNull();
  });

  it('renders nothing without apartments', async () => {
    mocks.apartments.mockResolvedValue([]);

    expect(await ChargesSection()).toBeNull();
  });
});
