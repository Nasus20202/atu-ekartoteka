import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChargesOverview } from '@/components/charges/charges-overview';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findCharges: vi.fn(),
  isApprovedAccount: vi.fn(),
  getSortedPeriods: vi.fn(),
  display: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/auth/account-access', () => ({
  isApprovedAccount: mocks.isApprovedAccount,
}));
vi.mock('@/lib/settings/tenant-history', () => ({
  getTenantHistoryStartYear: vi.fn().mockResolvedValue(2020),
}));
vi.mock('@/lib/utils/request-now', () => ({
  getRequestNow: vi.fn().mockResolvedValue(new Date('2025-03-10T00:00:00Z')),
}));
vi.mock('@/lib/queries/users/find-user-with-apartment-charges', () => ({
  findUserWithApartmentChargesCached: mocks.findCharges,
}));
vi.mock('@/app/dashboard/charges/charges-by-period', () => ({
  groupApartmentChargesByPeriod: () => ({ '2025-03': [] }),
  getSortedPeriods: mocks.getSortedPeriods,
  toActivePeriod: (month?: string) => month ?? null,
}));
vi.mock('@/components/charges/multi-charges-display', () => ({
  MultiChargesDisplay: (props: unknown) => {
    mocks.display(props);
    return <div>charges</div>;
  },
}));

const searchParams = (month?: string) => Promise.resolve({ month });

describe('ChargesOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.isApprovedAccount.mockReturnValue(true);
    mocks.findCharges.mockResolvedValue({ apartments: [] });
  });

  it('shows the charges grouped by period', async () => {
    mocks.getSortedPeriods.mockReturnValue(['2025-03']);

    render(await ChargesOverview({ searchParams: searchParams('2025-03') }));

    expect(screen.getByText('charges')).toBeInTheDocument();
    expect(mocks.display).toHaveBeenCalledWith({
      periods: ['2025-03'],
      chargesByPeriod: { '2025-03': [] },
      activeMonth: '2025-03',
    });
  });

  it('shows an empty state when there are no charges', async () => {
    mocks.getSortedPeriods.mockReturnValue([]);

    render(await ChargesOverview({ searchParams: searchParams() }));

    expect(screen.getByText('Brak naliczeń')).toBeInTheDocument();
    expect(mocks.display).not.toHaveBeenCalled();
  });

  it('redirects anonymous visitors to the login page', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(
      ChargesOverview({ searchParams: searchParams() })
    ).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('redirects to the dashboard when the account is not approved', async () => {
    mocks.isApprovedAccount.mockReturnValue(false);

    await expect(
      ChargesOverview({ searchParams: searchParams() })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard');
  });

  it('redirects to the dashboard when the user is missing', async () => {
    mocks.findCharges.mockResolvedValue(null);

    await expect(
      ChargesOverview({ searchParams: searchParams() })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard');
  });
});
