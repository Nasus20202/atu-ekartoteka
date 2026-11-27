import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findApartments: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireApprovedTenant,
}));
vi.mock('@/lib/apartments/queries/find-user-apartment-options', () => ({
  findUserApartmentOptions: mocks.findApartments,
}));

import { loadDefaultApartmentId } from '@/app/dashboard/settlements/load-default-apartment-id';

describe('loadDefaultApartmentId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
  });

  it('is the first own apartment', async () => {
    mocks.findApartments.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

    expect(await loadDefaultApartmentId()).toBe('a1');
    expect(mocks.findApartments).toHaveBeenCalledWith('user-1');
  });

  it('is null without an apartment', async () => {
    mocks.findApartments.mockResolvedValue([]);

    expect(await loadDefaultApartmentId()).toBeNull();
  });

  it('reads nothing for a caller who is sent away', async () => {
    mocks.requireApprovedTenant.mockRejectedValue(new Error('REDIRECT'));

    await expect(loadDefaultApartmentId()).rejects.toThrow('REDIRECT');
    expect(mocks.findApartments).not.toHaveBeenCalled();
  });
});
