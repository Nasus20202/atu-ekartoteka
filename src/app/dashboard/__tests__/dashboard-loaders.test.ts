import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  findUser: vi.fn(),
  findUserWithApartments: vi.fn(),
  findChargeTotals: vi.fn(),
  findMonthlySums: vi.fn(),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserByIdCached: mocks.findUser,
}));
vi.mock('@/lib/queries/users/find-user-with-apartments', () => ({
  findUserWithApartmentsCached: mocks.findUserWithApartments,
}));
vi.mock('@/lib/queries/charges/find-charge-totals-by-period', () => ({
  findChargeTotalsByPeriod: mocks.findChargeTotals,
}));
vi.mock('@/lib/queries/payments/find-monthly-charge-sums', () => ({
  findMonthlyChargeSums: mocks.findMonthlySums,
}));
vi.mock('@/lib/settings/tenant-history', () => ({
  getTenantHistoryStartYear: vi.fn().mockResolvedValue(2024),
}));

const loaders = await import('@/app/dashboard/dashboard-loaders');

describe('dashboard loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to login without a session', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(loaders.loadDashboardContext()).rejects.toThrow(
      'NEXT_REDIRECT:/login'
    );
  });

  it('loads the user within the tenant history window', async () => {
    mocks.findUserWithApartments.mockResolvedValue(null);

    await loaders.loadDashboardUser();

    expect(mocks.findUserWithApartments).toHaveBeenCalledWith(
      'user-1',
      2024,
      expect.stringMatching(/^\d{6}$/)
    );
  });

  it('loads charge totals for the current and previous period only', async () => {
    mocks.findChargeTotals.mockResolvedValue(new Map());

    await loaders.loadPeriodTotals();

    expect(mocks.findChargeTotals).toHaveBeenCalledWith('user-1', 2024, [
      expect.stringMatching(/^\d{6}$/),
      expect.stringMatching(/^\d{6}$/),
    ]);
  });

  it('does not wait for the apartments query to load the light user', async () => {
    mocks.findUser.mockResolvedValue({ id: 'user-1', name: 'Jan' });
    mocks.findUserWithApartments.mockReturnValue(new Promise(() => {}));

    await expect(loaders.loadAccountUser()).resolves.toMatchObject({
      name: 'Jan',
    });
  });

  it('returns no apartments for a missing user without querying charges', async () => {
    mocks.findUserWithApartments.mockResolvedValue(null);

    await expect(loaders.loadApartmentsWithCharges()).resolves.toEqual([]);
    expect(mocks.findMonthlySums).not.toHaveBeenCalled();
  });

  it('merges monthly charge sums into the apartments', async () => {
    mocks.findUserWithApartments.mockResolvedValue({
      apartments: [{ id: 'apt-1' }],
    });
    mocks.findMonthlySums.mockResolvedValue(
      new Map([['apt-1', new Map([['202601', '10']])]])
    );

    const apartments = await loaders.loadApartmentsWithCharges();

    expect(mocks.findMonthlySums).toHaveBeenCalledWith(['apt-1'], {
      fromPeriod: '202401',
    });
    expect(apartments[0].charges).toEqual([
      { period: '202601', totalAmount: '10' },
    ]);
  });
});
