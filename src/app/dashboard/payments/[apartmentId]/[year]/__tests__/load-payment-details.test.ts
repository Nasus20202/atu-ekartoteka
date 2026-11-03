import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireTenant: vi.fn(),
  findApartment: vi.fn(),
  findYears: vi.fn(),
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
vi.mock(
  '@/lib/queries/apartments/find-apartment-with-payments-by-year',
  () => ({
    findApartmentWithPaymentsByYearCached: mocks.findApartment,
  })
);
vi.mock('@/lib/queries/apartments/find-apartment-payment-years', () => ({
  findApartmentPaymentYearsCached: mocks.findYears,
}));
vi.mock('@/lib/settings/tenant-history', () => ({
  getTenantHistoryStartYear: vi.fn().mockResolvedValue(2024),
}));

const { loadPaymentDetails } =
  await import('@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details');

describe('loadPaymentDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenant.mockResolvedValue({ userId: 'user-1' });
    mocks.findYears.mockResolvedValue([2025, 2026]);
    mocks.findApartment.mockResolvedValue({
      id: 'apt-1',
      payments: [{ year: 2026 }],
    });
  });

  it('loads the apartment year and the available years for the session owner', async () => {
    const details = await loadPaymentDetails('apt-1', '2026');

    expect(details).toMatchObject({
      payment: { year: 2026 },
      paymentYears: [2025, 2026],
    });
    expect(mocks.findApartment).toHaveBeenCalledWith(
      'apt-1',
      'user-1',
      2026,
      2024,
      expect.stringMatching(/^\d{6}$/)
    );
    expect(mocks.findYears).toHaveBeenCalledWith('apt-1', 'user-1', 2024);
  });

  it('responds with not found for an invalid year', async () => {
    await expect(loadPaymentDetails('apt-1', 'abc')).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(mocks.findApartment).not.toHaveBeenCalled();
  });

  it('responds with not found when the year has no payments', async () => {
    mocks.findApartment.mockResolvedValue({ id: 'apt-1', payments: [] });

    await expect(loadPaymentDetails('apt-1', '2026')).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });
});
