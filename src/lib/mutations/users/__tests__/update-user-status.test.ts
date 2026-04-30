import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus } from '@/lib/types';

const mockUserUpdate = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      update: mockUserUpdate,
    },
  },
}));

const { updateUserStatus } = await import('../update-user-status');

describe('updateUserStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserUpdate.mockResolvedValue({ id: 'user-1', apartments: [] });
  });

  it('does not change apartment assignments when apartmentIds are omitted', async () => {
    await updateUserStatus({
      userId: 'user-1',
      status: AccountStatus.APPROVED,
    });

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        status: AccountStatus.APPROVED,
      },
      include: { apartments: true },
    });
  });

  it('clears apartment assignments when approving with an empty list', async () => {
    await updateUserStatus({
      userId: 'user-1',
      status: AccountStatus.APPROVED,
      apartmentIds: [],
    });

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        status: AccountStatus.APPROVED,
        apartments: { set: [] },
      },
      include: { apartments: true },
    });
  });

  it('sets apartment assignments when apartmentIds are provided', async () => {
    await updateUserStatus({
      userId: 'user-1',
      status: AccountStatus.APPROVED,
      apartmentIds: ['apt-1', 'apt-2'],
    });

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        status: AccountStatus.APPROVED,
        apartments: { set: [{ id: 'apt-1' }, { id: 'apt-2' }] },
      },
      include: { apartments: true },
    });
  });

  it('clears apartment assignments for rejected users', async () => {
    await updateUserStatus({
      userId: 'user-1',
      status: AccountStatus.REJECTED,
      apartmentIds: ['apt-1'],
    });

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        status: AccountStatus.REJECTED,
        apartments: { set: [] },
      },
      include: { apartments: true },
    });
  });
});
