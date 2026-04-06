import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function makeNotification(
  id: string,
  totalAmount: number,
  hoaId: string | null = 'hoa-1',
  hoaName: string | null = 'Wspólnota Alpha'
) {
  return {
    id,
    externalId: `EXT-${id}`,
    description: `Naliczenie ${id}`,
    quantity: 1,
    unit: 'szt',
    unitPrice: totalAmount,
    totalAmount,
    lineNo: 1,
    apartmentId: 'apt-1',
    apartmentNumber: '101',
    apartmentAddress: 'ul. Testowa 1 A/101',
    hoaId,
    hoaName,
    hoaHeader: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('NotificationsSidebar', () => {
  it('renders nothing when notifications list is empty', () => {
    const { container } = render(<NotificationsSidebar notifications={[]} />);
    expect(container.firstChild).toBeNull();
  });

  describe('groupByHoa — single HOA', () => {
    it('renders total amount and flat list when all notifications belong to one HOA', () => {
      const notifications = [
        makeNotification('n1', 100, 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', 200, 'hoa-1', 'Wspólnota Alpha'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // Total displayed
      expect(screen.getByText('300.00 zł')).toBeInTheDocument();
      // Both notification descriptions visible
      expect(screen.getByText('Naliczenie n1')).toBeInTheDocument();
      expect(screen.getByText('Naliczenie n2')).toBeInTheDocument();
      // No collapsible HOA group triggers
      expect(screen.queryByText('Wspólnota Alpha')).not.toBeInTheDocument();
    });

    it('shows hoaHeader when present in single-HOA mode', () => {
      const notification = {
        ...makeNotification('n1', 100, 'hoa-1', 'Wspólnota Alpha'),
        hoaHeader: 'Numer konta: 12 3456 7890',
      };

      render(<NotificationsSidebar notifications={[notification]} />);

      expect(screen.getByText('Numer konta: 12 3456 7890')).toBeInTheDocument();
    });
  });

  describe('groupByHoa — multiple HOAs', () => {
    it('renders a collapsible group per HOA when notifications span multiple HOAs', () => {
      const notifications = [
        makeNotification('n1', 100, 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', 200, 'hoa-2', 'Wspólnota Beta'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // Both HOA names appear as group triggers
      expect(screen.getByText('Wspólnota Alpha')).toBeInTheDocument();
      expect(screen.getByText('Wspólnota Beta')).toBeInTheDocument();
    });

    it('shows subtotal per HOA group', () => {
      const notifications = [
        makeNotification('n1', 100, 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', 150, 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n3', 200, 'hoa-2', 'Wspólnota Beta'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // hoa-1 subtotal: 250.00 zł
      expect(screen.getByText('250.00 zł')).toBeInTheDocument();
      // hoa-2 subtotal 200.00 zł appears at least once (may appear also as individual amount)
      expect(screen.getAllByText('200.00 zł').length).toBeGreaterThanOrEqual(1);
    });

    it('shows grand total across all HOAs', () => {
      const notifications = [
        makeNotification('n1', 100, 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', 200, 'hoa-2', 'Wspólnota Beta'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // Grand total: 300.00 zł (in the top summary box)
      expect(screen.getByText('Łączna kwota do zapłaty')).toBeInTheDocument();
      expect(screen.getByText('300.00 zł')).toBeInTheDocument();
    });

    it('groups notifications with null hoaId under a single group', () => {
      const notifications = [
        makeNotification('n1', 100, null, null),
        makeNotification('n2', 50, null, null),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // Single group, rendered as flat list (isSingle = true)
      expect(screen.getByText('150.00 zł')).toBeInTheDocument();
    });
  });
});
