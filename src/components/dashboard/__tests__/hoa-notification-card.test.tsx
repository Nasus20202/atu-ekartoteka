import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { NotificationItem } from '@/components/dashboard/group-notifications';
import { HoaNotificationCard } from '@/components/dashboard/hoa-notification-card';
import { formatCurrency } from '@/lib/utils';

const exactText = (value: string) => (_: string, element: Element | null) =>
  element?.textContent === value && element.children.length === 0;

const HOA_NAME = 'Wspólnota Alpha';
const HOA_HEADER = 'Konto: 00 1111 2222';
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

function renderCard(
  notifications: NotificationItem[],
  hoaHeader: string | null = null
) {
  return render(
    <HoaNotificationCard
      hoaName={HOA_NAME}
      hoaHeader={hoaHeader}
      notifications={notifications}
    />
  );
}

describe('HoaNotificationCard', () => {
  it('uses the address as heading and the HOA as subtitle for one apartment', () => {
    renderCard([makeNotification('n1', '100'), makeNotification('n2', '200')]);

    expect(
      screen.getByRole('heading', { level: 3, name: ADDRESS_A })
    ).toBeInTheDocument();
    expect(screen.getByText(HOA_NAME)).toBeInTheDocument();
    expect(
      screen.getByText(exactText(formatCurrency(300)))
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  });

  it('shows amount and quantity breakdown for each notification', () => {
    renderCard([makeNotification('n1', '20')]);

    expect(screen.getAllByText(exactText(formatCurrency(20)))).toHaveLength(2);
    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.textContent === `2 szt × ${formatCurrency(10)}` &&
          element.tagName === 'DIV'
        )
      )
    ).toBeInTheDocument();
  });

  it('merges apartments of the HOA under its name with subtotals', () => {
    renderCard([
      makeNotification('n1', '100', ADDRESS_A),
      makeNotification('n2', '200', ADDRESS_B),
      makeNotification('n3', '50', ADDRESS_A),
    ]);

    expect(
      screen.getByRole('heading', { level: 3, name: HOA_NAME })
    ).toBeInTheDocument();
    expect(
      screen.getByText(exactText(formatCurrency(350)))
    ).toBeInTheDocument();
    const groupA = screen
      .getByRole('heading', { level: 4, name: ADDRESS_A })
      .closest('section')!;
    expect(
      within(groupA).getByText(exactText(formatCurrency(150)))
    ).toBeInTheDocument();
    expect(within(groupA).getByText('Naliczenie n3')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 4, name: ADDRESS_B })
    ).toBeInTheDocument();
  });

  it('shows the HOA notice above the charges', () => {
    renderCard([makeNotification('n1', '100')], HOA_HEADER);

    expect(
      screen.getByRole('note', { name: 'Zawiadomienie wspólnoty' })
    ).toHaveTextContent(HOA_HEADER);
    expect(
      screen
        .getByText(HOA_HEADER)
        .compareDocumentPosition(screen.getByText('Naliczenie n1')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it.each([
    ['one apartment', [makeNotification('n1', '100')]],
    [
      'several apartments',
      [
        makeNotification('n1', '100', ADDRESS_A),
        makeNotification('n2', '200', ADDRESS_B),
      ],
    ],
  ])('shows the HOA footer below the charges for %s', (_, notifications) => {
    render(
      <HoaNotificationCard
        hoaName={HOA_NAME}
        hoaHeader={null}
        hoaFooter="Stopka wspólnoty"
        notifications={notifications}
      />
    );

    expect(
      screen.getByRole('note', { name: 'Zawiadomienie wspólnoty' })
    ).toHaveTextContent('Stopka wspólnoty');
    expect(
      screen
        .getByText('Naliczenie n1')
        .compareDocumentPosition(screen.getByText('Stopka wspólnoty')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('omits the notice section when the HOA has no header', () => {
    renderCard([makeNotification('n1', '100')]);

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('uses a default heading for several apartments without an HOA name', () => {
    render(
      <HoaNotificationCard
        hoaName={null}
        hoaHeader={null}
        notifications={[
          makeNotification('n1', '100', ADDRESS_A),
          makeNotification('n2', '200', ADDRESS_B),
        ]}
      />
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      /^Wspólnota$/
    );
  });
});
