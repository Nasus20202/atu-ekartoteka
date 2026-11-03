import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentsSection } from '@/components/dashboard/sections/payments-section';

const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  user: vi.fn(),
  balances: vi.fn(),
}));

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: () => mocks.account(),
  loadDashboardUser: () => mocks.user(),
  loadDashboardContext: () => Promise.resolve({ currentPeriod: '202611' }),
}));
vi.mock('@/app/dashboard/dashboard-data', () => ({
  buildApartmentBalances: (...args: unknown[]) => mocks.balances(...args),
}));
vi.mock('@/components/dashboard/payments-summary-card', () => ({
  PaymentsSummaryCard: () => <div>Wpłaty</div>,
}));

describe('PaymentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ status: 'APPROVED' });
    mocks.user.mockResolvedValue({ apartments: [{ id: 'apt-1' }] });
    mocks.balances.mockReturnValue([{ apartmentId: 'apt-1' }]);
  });

  it('renders the balances of an approved user', async () => {
    render(await PaymentsSection());

    expect(screen.getByText('Wpłaty')).toBeInTheDocument();
    expect(mocks.balances).toHaveBeenCalledWith([{ id: 'apt-1' }], '202611');
  });

  it('renders nothing for a pending user', async () => {
    mocks.account.mockResolvedValue({ status: 'PENDING' });

    expect(await PaymentsSection()).toBeNull();
  });

  it('renders nothing without any balance', async () => {
    mocks.balances.mockReturnValue([]);

    expect(await PaymentsSection()).toBeNull();
  });
});
