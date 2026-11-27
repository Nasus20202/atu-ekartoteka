import { describe, expect, it, vi } from 'vitest';

const findMany = vi.hoisted(() => vi.fn());

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: { apartment: { findMany } },
}));

import { findUserApartmentOptions } from '@/lib/apartments/queries/find-user-apartment-options';

describe('findUserApartmentOptions', () => {
  it('reads only the apartments of the user', async () => {
    findMany.mockResolvedValue([{ id: 'a1' }]);

    expect(await findUserApartmentOptions('user-1')).toEqual([{ id: 'a1' }]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
  });
});
