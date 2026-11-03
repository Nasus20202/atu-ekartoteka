import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
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

const { requireApprovedTenant } =
  await import('@/lib/auth/require-approved-tenant');

describe('requireApprovedTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findUser.mockResolvedValue({ id: 'user-1', status: 'APPROVED' });
  });

  it('returns the session owner for an approved user', async () => {
    await expect(requireApprovedTenant()).resolves.toMatchObject({
      userId: 'user-1',
    });
  });

  it('redirects anonymous visitors to login', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requireApprovedTenant()).rejects.toThrow(
      'NEXT_REDIRECT:/login'
    );
  });

  it.each([['PENDING'], ['REJECTED']])(
    'redirects a %s account to the dashboard',
    async (status) => {
      mocks.findUser.mockResolvedValue({ id: 'user-1', status });

      await expect(requireApprovedTenant()).rejects.toThrow(
        'NEXT_REDIRECT:/dashboard'
      );
    }
  );

  it('redirects a deleted user to the dashboard', async () => {
    mocks.findUser.mockResolvedValue(null);

    await expect(requireApprovedTenant()).rejects.toThrow(
      'NEXT_REDIRECT:/dashboard'
    );
  });
});
