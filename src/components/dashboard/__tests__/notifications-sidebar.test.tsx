import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { formatCurrency } from '@/lib/utils';

const withExactText =
  (value: string) => (_: string, element: Element | null) => {
    if (!element) {
      return false;
    }

    return (
      element.textContent === value &&
      Array.from(element.children).every((child) => child.textContent !== value)
    );
  };

function makeNotification(
  id: string,
  totalAmount: string,
  hoaId: string | null = 'hoa-1',
  hoaName: string | null = 'Wspólnota Alpha'
) {
  return {
    id,
    externalId: `EXT-${id}`,
    description: `Naliczenie ${id}`,
    quantity: '1',
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
    it('renders total amount and one HOA card', () => {
      const notifications = [
        makeNotification('n1', '100', 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', '200', 'hoa-1', 'Wspólnota Alpha'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      expect(screen.getByText('Łączna kwota do zapłaty')).toBeInTheDocument();
      expect(
        screen.getAllByText(withExactText(formatCurrency(300)))
      ).toHaveLength(2);
      expect(screen.getAllByRole('article')).toHaveLength(1);
      expect(screen.getByText('Naliczenie n1')).toBeInTheDocument();
      expect(screen.getByText('Naliczenie n2')).toBeInTheDocument();
    });

    it('offers the notice PDF next to the total amount', () => {
      render(
        <NotificationsSidebar notifications={[makeNotification('1', '10')]} />
      );

      const button = screen.getByRole('button', { name: /Pobierz PDF/ });
      expect(button.closest('.rounded-lg')).toHaveTextContent(
        'Łączna kwota do zapłaty'
      );
    });

    it('shows hoaHeader as the HOA notice', () => {
      const notification = {
        ...makeNotification('n1', '100', 'hoa-1', 'Wspólnota Alpha'),
        hoaHeader: 'Numer konta: 12 3456 7890',
      };

      render(<NotificationsSidebar notifications={[notification]} />);

      expect(screen.getByText('Numer konta: 12 3456 7890')).toBeInTheDocument();
    });
  });

  describe('groupByHoa — multiple HOAs', () => {
    it('renders a card per HOA when notifications span multiple HOAs', () => {
      const notifications = [
        makeNotification('n1', '100', 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', '200', 'hoa-2', 'Wspólnota Beta'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      expect(screen.getAllByRole('article')).toHaveLength(2);
      expect(screen.getByText('Wspólnota Alpha')).toBeInTheDocument();
      expect(screen.getByText('Wspólnota Beta')).toBeInTheDocument();
    });

    it('shows subtotal per HOA group', () => {
      const notifications = [
        makeNotification('n1', '100', 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', '150', 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n3', '200', 'hoa-2', 'Wspólnota Beta'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // hoa-1 subtotal: 250.00 zł
      expect(
        screen.getByText(withExactText(formatCurrency(250)))
      ).toBeInTheDocument();
      // hoa-2 subtotal 200.00 zł appears at least once (may appear also as individual amount)
      expect(
        screen.getAllByText(withExactText(formatCurrency(200))).length
      ).toBeGreaterThanOrEqual(1);
    });

    it('shows grand total across all HOAs', () => {
      const notifications = [
        makeNotification('n1', '100', 'hoa-1', 'Wspólnota Alpha'),
        makeNotification('n2', '200', 'hoa-2', 'Wspólnota Beta'),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      // Grand total: 300.00 zł (in the top summary box)
      expect(screen.getByText('Łączna kwota do zapłaty')).toBeInTheDocument();
      expect(
        screen.getByText(withExactText(formatCurrency(300)))
      ).toBeInTheDocument();
    });

    it('groups notifications with null hoaId under a single group', () => {
      const notifications = [
        makeNotification('n1', '100', null, null),
        makeNotification('n2', '50', null, null),
      ];

      render(<NotificationsSidebar notifications={notifications} />);

      expect(screen.getAllByRole('article')).toHaveLength(1);
      expect(
        screen.getAllByText(withExactText(formatCurrency(150)))
      ).toHaveLength(2);
    });
  });
});
