import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireTenant: vi.fn(),
  findApartment: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireTenant,
}));
vi.mock('@/lib/queries/apartments/find-apartment-with-charges', () => ({
  findApartmentWithChargesCached: mocks.findApartment,
}));
vi.mock('@/lib/settings/tenant-history', () => ({
  getTenantHistoryStartYear: vi.fn().mockResolvedValue(2024),
}));

const { loadApartmentCharges } =
  await import('@/app/dashboard/charges/[apartmentId]/load-apartment-charges');

describe('loadApartmentCharges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenant.mockResolvedValue({ userId: 'user-1' });
  });

  it('scopes the query to the session owner and the history window', async () => {
    mocks.findApartment.mockResolvedValue({ id: 'apt-1' });

    await expect(loadApartmentCharges('apt-1')).resolves.toEqual({
      id: 'apt-1',
    });
    expect(mocks.findApartment).toHaveBeenCalledWith(
      'apt-1',
      'user-1',
      2024,
      expect.stringMatching(/^\d{6}$/)
    );
  });

  it('responds with not found for an apartment the user does not own', async () => {
    mocks.findApartment.mockResolvedValue(null);

    await expect(loadApartmentCharges('apt-2')).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });
});
