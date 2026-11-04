import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentsOverview } from '@/components/payments/payments-overview';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findPayments: vi.fn(),
  isApprovedAccount: vi.fn(),
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
vi.mock('@/lib/queries/users/find-user-with-apartment-payments', () => ({
  findUserWithApartmentPaymentsCached: mocks.findPayments,
}));
vi.mock('@/lib/utils/apartment-label', () => ({
  formatApartmentLabel: (apartment: { id: string }) => `label-${apartment.id}`,
}));
vi.mock('@/app/dashboard/payments/payment-year-entries', () => ({
  toPaymentYearEntries: (apartment: { payments: { id: string }[] }) =>
    apartment.payments.map((payment) => ({
      payment,
      apartmentId: 'apt-1',
      apartmentLabel: 'label',
      hoaName: 'HOA',
      dateFromLabel: 'od',
      dateToLabel: 'do',
    })),
}));
vi.mock('@/components/payments/payment-year-row', () => ({
  PaymentYearRow: ({ payment }: { payment: { id: string } }) => (
    <div>row-{payment.id}</div>
  ),
}));

const apartment = (id: string, payments: { id: string }[]) => ({
  id,
  postalCode: '80-001',
  city: 'Gdańsk',
  payments,
});

describe('PaymentsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.isApprovedAccount.mockReturnValue(true);
  });

  it('lists every apartment with its payment years', async () => {
    mocks.findPayments.mockResolvedValue({
      apartments: [
        apartment('a1', [{ id: 'p1' }, { id: 'p2' }]),
        apartment('a2', []),
      ],
    });

    render(await PaymentsOverview());

    expect(screen.getByText('label-a1')).toBeInTheDocument();
    expect(screen.getByText('row-p1')).toBeInTheDocument();
    expect(screen.getByText('row-p2')).toBeInTheDocument();
    expect(screen.getByText('label-a2')).toBeInTheDocument();
    expect(screen.getByText('Brak danych o wpłatach')).toBeInTheDocument();
    expect(mocks.findPayments).toHaveBeenCalledWith(
      'user-1',
      2020,
      expect.any(String)
    );
  });

  it('redirects anonymous visitors to the login page', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(PaymentsOverview()).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('redirects to the dashboard when the account is not approved', async () => {
    mocks.findPayments.mockResolvedValue({ apartments: [] });
    mocks.isApprovedAccount.mockReturnValue(false);

    await expect(PaymentsOverview()).rejects.toThrow(
      'NEXT_REDIRECT:/dashboard'
    );
  });

  it('redirects to the dashboard when the user is missing', async () => {
    mocks.findPayments.mockResolvedValue(null);

    await expect(PaymentsOverview()).rejects.toThrow(
      'NEXT_REDIRECT:/dashboard'
    );
  });
});
