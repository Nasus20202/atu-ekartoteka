import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from '@/app/dashboard/page';
import { Prisma } from '@/generated/prisma/browser';
import { AccountStatus } from '@/lib/types';

const {
  mockAuth,
  mockRedirect,
  mockFindUserWithApartmentsCached,
  mockGetRecentChargeTrendByHoa,
  mockNotificationsSidebar,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRedirect: vi.fn(),
  mockFindUserWithApartmentsCached: vi.fn(),
  mockGetRecentChargeTrendByHoa: vi.fn(),
  mockNotificationsSidebar: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('@/lib/queries/users/find-user-with-apartments', () => ({
  findUserWithApartmentsCached: mockFindUserWithApartmentsCached,
}));

vi.mock('@/components/charts/chart-data', () => ({
  getRecentChargeTrendByHoa: mockGetRecentChargeTrendByHoa,
}));

vi.mock('@/components/account/user-status-section', () => ({
  UserStatusSection: ({ email }: { email: string }) => <div>{email}</div>,
}));

vi.mock('@/components/dashboard/apartments-section', () => ({
  ApartmentsSection: () => <div>Mieszkania</div>,
}));

vi.mock('@/components/dashboard/charges-summary-card', () => ({
  ChargesSummaryCard: () => <div>Naliczenia</div>,
}));

vi.mock('@/components/dashboard/payments-summary-card', () => ({
  PaymentsSummaryCard: () => <div>Wpłaty</div>,
}));

vi.mock('@/components/dashboard/notifications-sidebar', () => ({
  NotificationsSidebar: (props: unknown) => {
    mockNotificationsSidebar(props);
    return <div>Powiadomienia</div>;
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecentChargeTrendByHoa.mockReturnValue({ data: [], series: [] });
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('passes stringified notification decimals to the sidebar', async () => {
    mockFindUserWithApartmentsCached.mockResolvedValue({
      id: 'user-1',
      name: 'Jan',
      email: 'jan@example.com',
      status: AccountStatus.APPROVED,
      apartments: [
        {
          id: 'apt-1',
          number: '10',
          address: 'Testowa',
          building: '1',
          city: 'Warszawa',
          postalCode: '00-001',
          owner: 'Jan',
          shareNumerator: 1,
          shareDenominator: 10,
          charges: [],
          payments: [
            {
              year: 2026,
              closingBalance: new Prisma.Decimal('123.4500'),
            },
          ],
          chargeNotifications: [
            {
              id: 'notif-1',
              lineNo: 1,
              description: 'Fundusz remontowy',
              quantity: new Prisma.Decimal('50.5000'),
              unit: 'm2',
              unitPrice: new Prisma.Decimal('2.5000'),
              totalAmount: new Prisma.Decimal('126.2500'),
              createdAt: new Date('2026-04-01T00:00:00.000Z'),
              updatedAt: new Date('2026-04-01T00:00:00.000Z'),
            },
          ],
          homeownersAssociation: {
            id: 'hoa-1',
            name: 'Wspólnota Test',
            header: 'Header',
          },
        },
      ],
    });

    render(await DashboardPage());

    expect(screen.getByText('Powiadomienia')).toBeInTheDocument();
    expect(mockNotificationsSidebar).toHaveBeenCalledTimes(1);
    expect(mockNotificationsSidebar.mock.calls[0][0]).toMatchObject({
      notifications: [
        expect.objectContaining({
          id: 'notif-1',
          quantity: '50.5',
          unitPrice: '2.5',
          totalAmount: '126.25',
          apartmentNumber: '10',
          apartmentAddress: 'Testowa 1/10',
          hoaId: 'hoa-1',
          hoaName: 'Wspólnota Test',
          hoaHeader: 'Header',
        }),
      ],
    });
  });

  it('redirects to login when session is missing', async () => {
    mockAuth.mockResolvedValue(null);
    mockRedirect.mockImplementation(() => {
      throw new Error('redirect');
    });

    await expect(DashboardPage()).rejects.toThrow('redirect');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to login when user data is missing', async () => {
    mockFindUserWithApartmentsCached.mockResolvedValue(null);
    mockRedirect.mockImplementation(() => {
      throw new Error('redirect');
    });

    await expect(DashboardPage()).rejects.toThrow('redirect');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('does not render approved-only sections for pending user', async () => {
    mockFindUserWithApartmentsCached.mockResolvedValue({
      id: 'user-1',
      name: null,
      email: 'jan@example.com',
      status: AccountStatus.PENDING,
      apartments: [],
    });

    render(await DashboardPage());

    expect(screen.queryByText('Powiadomienia')).not.toBeInTheDocument();
    expect(screen.queryByText('Naliczenia')).not.toBeInTheDocument();
    expect(screen.queryByText('Mieszkania')).not.toBeInTheDocument();
  });
});
