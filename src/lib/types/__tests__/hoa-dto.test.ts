import { describe, expect, it } from 'vitest';

import { toHoaListItemDto } from '@/lib/types/dto/hoa-dto';

describe('toHoaListItemDto', () => {
  it('flattens the apartment count and serialises dates', () => {
    expect(
      toHoaListItemDto({
        id: 'hoa-1',
        externalId: 'W1',
        name: 'Wspólnota',
        _count: { apartments: 3 },
        apartmentsDataDate: new Date('2025-01-01T00:00:00.000Z'),
        chargesDataDate: null,
        notificationsDataDate: '2025-02-01T00:00:00.000Z',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-06-01T00:00:00.000Z'),
      })
    ).toEqual({
      id: 'hoa-1',
      externalId: 'W1',
      name: 'Wspólnota',
      apartmentCount: 3,
      apartmentsDataDate: '2025-01-01T00:00:00.000Z',
      chargesDataDate: null,
      notificationsDataDate: '2025-02-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-06-01T00:00:00.000Z',
    });
  });
});
