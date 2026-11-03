import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationsSection } from '@/components/dashboard/sections/notifications-section';
import { Prisma } from '@/generated/prisma/browser';

const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  user: vi.fn(),
  sidebar: vi.fn(),
}));

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: () => mocks.account(),
  loadDashboardUser: () => mocks.user(),
}));
vi.mock('@/components/dashboard/notifications-sidebar', () => ({
  NotificationsSidebar: (props: unknown) => {
    mocks.sidebar(props);
    return <div>Powiadomienia</div>;
  },
}));

const apartment = {
  number: '10',
  address: 'Testowa',
  building: '1',
  chargeNotifications: [
    {
      id: 'notif-1',
      quantity: new Prisma.Decimal('50.5000'),
      unitPrice: new Prisma.Decimal('2.5000'),
      totalAmount: new Prisma.Decimal('126.2500'),
    },
  ],
  homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota', header: 'H' },
};

describe('NotificationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ status: 'APPROVED' });
    mocks.user.mockResolvedValue({ apartments: [apartment] });
  });

  it('passes stringified notification decimals to the sidebar', async () => {
    render(await NotificationsSection());

    expect(screen.getByText('Powiadomienia')).toBeInTheDocument();
    expect(mocks.sidebar.mock.calls[0][0]).toMatchObject({
      notifications: [
        expect.objectContaining({
          id: 'notif-1',
          quantity: '50.5',
          unitPrice: '2.5',
          totalAmount: '126.25',
          hoaId: 'hoa-1',
        }),
      ],
    });
  });

  it('renders nothing without notifications', async () => {
    mocks.user.mockResolvedValue({
      apartments: [{ ...apartment, chargeNotifications: [] }],
    });

    expect(await NotificationsSection()).toBeNull();
  });

  it('renders nothing for a pending user', async () => {
    mocks.account.mockResolvedValue({ status: 'PENDING' });

    expect(await NotificationsSection()).toBeNull();
  });
});
