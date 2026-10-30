import { describe, expect, it } from 'vitest';

import { buildApartmentsWhere } from '@/app/api/admin/apartments/apartments-where';

const NO_FILTER = {
  search: '',
  activeOnly: false,
  hoaId: null,
  assignableTo: null,
};

describe('buildApartmentsWhere', () => {
  it('limits assignable apartments to free ones and the edited user', () => {
    expect(
      buildApartmentsWhere({ ...NO_FILTER, assignableTo: 'user-1' })
    ).toEqual({
      AND: [{}, {}, { OR: [{ userId: null }, { userId: 'user-1' }] }, {}],
    });
  });

  it('searches the owner email', () => {
    const where = buildApartmentsWhere({ ...NO_FILTER, search: 'jan@' });

    expect(where.AND).toContainEqual(
      expect.objectContaining({
        OR: expect.arrayContaining([
          { email: { contains: 'jan@', mode: 'insensitive' } },
        ]),
      })
    );
  });

  it('splits a building/number search', () => {
    const where = buildApartmentsWhere({ ...NO_FILTER, search: '17/12' });

    expect(where.AND).toContainEqual({
      AND: [
        { OR: [{ building: { contains: '17', mode: 'insensitive' } }] },
        { number: { contains: '12', mode: 'insensitive' } },
      ],
    });
  });

  it('matches a full label by address, building and number', () => {
    const where = buildApartmentsWhere({
      ...NO_FILTER,
      search: 'ul. Testowa 1/2B',
    });

    expect(where.AND).toContainEqual({
      AND: [
        {
          OR: [
            { building: { contains: 'ul. Testowa 1', mode: 'insensitive' } },
            {
              address: { contains: 'ul. Testowa', mode: 'insensitive' },
              building: { contains: '1', mode: 'insensitive' },
            },
          ],
        },
        { number: { contains: '2B', mode: 'insensitive' } },
      ],
    });
  });
});
