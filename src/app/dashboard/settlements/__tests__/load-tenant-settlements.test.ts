import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findApartments: vi.fn(),
  findSettlements: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/framework/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireApprovedTenant,
}));
vi.mock('@/lib/framework/tenant-history', () => ({
  getTenantHistoryStartYear: async () => 2024,
}));
vi.mock('@/lib/apartments/queries/find-user-apartment-options', () => ({
  findUserApartmentOptions: mocks.findApartments,
}));
vi.mock('@/lib/settlements/queries/find-tenant-settlements', () => ({
  findTenantSettlements: mocks.findSettlements,
}));

import { loadTenantSettlements } from '@/app/dashboard/settlements/load-tenant-settlements';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

const APARTMENTS = [{ id: 'a1' }, { id: 'a2' }];

describe('loadTenantSettlements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
    mocks.findApartments.mockResolvedValue(APARTMENTS);
    mocks.findSettlements.mockResolvedValue({ utility: null });
  });

  it('reads nothing for a caller who is sent away', async () => {
    mocks.requireApprovedTenant.mockRejectedValue(new Error('REDIRECT'));

    await expect(loadTenantSettlements('a1', {})).rejects.toThrow('REDIRECT');
    expect(mocks.findApartments).not.toHaveBeenCalled();
    expect(mocks.findSettlements).not.toHaveBeenCalled();
  });

  it('takes the apartment of the path', async () => {
    const page = await loadTenantSettlements('a2', {});

    expect(mocks.findApartments).toHaveBeenCalledWith('user-1');
    expect(mocks.findSettlements).toHaveBeenCalledWith('user-1', 'a2', 2024, {
      utilityId: undefined,
      annualId: undefined,
      readings: ALL_READINGS,
    });
    expect(page.apartment).toBe(APARTMENTS[1]);
  });

  it('takes the requested periods', async () => {
    await loadTenantSettlements('a1', { period: 'u1', year: ['r1'] });

    expect(mocks.findSettlements).toHaveBeenCalledWith('user-1', 'a1', 2024, {
      utilityId: 'u1',
      annualId: undefined,
      readings: ALL_READINGS,
    });
  });

  it('does not find an apartment that is not assigned to the user', async () => {
    await expect(loadTenantSettlements('other', {})).rejects.toThrow(
      'NOT_FOUND'
    );
    expect(mocks.findSettlements).not.toHaveBeenCalled();
  });

  it('does not find a record outside the scope', async () => {
    mocks.findSettlements.mockResolvedValue(null);

    await expect(
      loadTenantSettlements('a1', { period: 'old' })
    ).rejects.toThrow('NOT_FOUND');
  });
});
