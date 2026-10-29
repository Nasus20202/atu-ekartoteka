import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ApartmentNotificationList,
  type NotificationItem,
} from '@/components/dashboard/apartment-notification-list';
import { formatCurrency } from '@/lib/utils';

const exactText = (value: string) => (_: string, element: Element | null) =>
  element?.textContent === value && element.children.length === 0;

const ADDRESS_A = 'ul. Testowa 1 A/101';
const ADDRESS_B = 'ul. Testowa 2 B/202';

function makeNotification(
  id: string,
  totalAmount: string,
  apartmentAddress = ADDRESS_A
): NotificationItem {
  return {
    id,
    description: `Naliczenie ${id}`,
    quantity: '2',
    unit: 'szt',
    unitPrice: '10',
    totalAmount,
    apartmentNumber: '101',
    apartmentAddress,
  };
}

describe('ApartmentNotificationList', () => {
  it('shows the address once as a heading for all its notifications', () => {
    render(
      <ApartmentNotificationList
        notifications={[
          makeNotification('n1', '100'),
          makeNotification('n2', '200'),
        ]}
      />
    );

    expect(screen.getAllByRole('heading', { name: ADDRESS_A })).toHaveLength(1);
    expect(screen.getByText('Naliczenie n1')).toBeInTheDocument();
    expect(screen.getByText('Naliczenie n2')).toBeInTheDocument();
  });

  it('shows amount and quantity breakdown for each notification', () => {
    render(
      <ApartmentNotificationList
        notifications={[makeNotification('n1', '20')]}
      />
    );

    expect(screen.getByText(exactText(formatCurrency(20)))).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.textContent === `2 szt × ${formatCurrency(10)}` &&
          element.tagName === 'DIV'
        )
      )
    ).toBeInTheDocument();
  });

  it('does not show a subtotal for a single apartment', () => {
    render(
      <ApartmentNotificationList
        notifications={[
          makeNotification('n1', '100'),
          makeNotification('n2', '200'),
        ]}
      />
    );

    expect(
      screen.queryByText(exactText(formatCurrency(300)))
    ).not.toBeInTheDocument();
  });

  it('groups notifications per apartment with subtotals', () => {
    render(
      <ApartmentNotificationList
        notifications={[
          makeNotification('n1', '100', ADDRESS_A),
          makeNotification('n2', '200', ADDRESS_B),
          makeNotification('n3', '50', ADDRESS_A),
        ]}
      />
    );

    const groupA = screen
      .getByRole('heading', { name: ADDRESS_A })
      .closest('section')!;
    const groupB = screen
      .getByRole('heading', { name: ADDRESS_B })
      .closest('section')!;
    expect(
      within(groupA).getByText(exactText(formatCurrency(150)))
    ).toBeInTheDocument();
    expect(within(groupA).getByText('Naliczenie n3')).toBeInTheDocument();
    expect(
      within(groupB).getAllByText(exactText(formatCurrency(200)))
    ).toHaveLength(2);
  });
});
