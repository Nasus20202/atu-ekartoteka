import { describe, expect, it } from 'vitest';

import {
  groupByApartment,
  type NotificationItem,
} from '@/components/dashboard/group-notifications';

function item(id: string, apartmentAddress: string): NotificationItem {
  return {
    id,
    description: 'Opłata',
    quantity: '1',
    unit: 'szt',
    unitPrice: '10',
    totalAmount: '10',
    apartmentNumber: '1',
    apartmentAddress,
  };
}

describe('groupByApartment', () => {
  it('groups notifications by apartment in first-seen order', () => {
    const groups = groupByApartment([
      item('1', 'ul. A 1'),
      item('2', 'ul. B 2'),
      item('3', 'ul. A 1'),
    ]);

    expect(groups.map((group) => group.address)).toEqual([
      'ul. A 1',
      'ul. B 2',
    ]);
    expect(groups[0].notifications.map((n) => n.id)).toEqual(['1', '3']);
  });

  it('keeps apartments with the same label in different HOAs apart', () => {
    const groups = groupByApartment([
      { ...item('1', 'ul. A 1'), hoaId: 'hoa-1' },
      { ...item('2', 'ul. A 1'), hoaId: 'hoa-2' },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[1].notifications.map((n) => n.id)).toEqual(['2']);
  });

  it('returns no groups for no notifications', () => {
    expect(groupByApartment([])).toEqual([]);
  });
});
