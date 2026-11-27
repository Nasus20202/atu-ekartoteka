import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveOpenVoting } from '@/lib/voting/use-cases/vote-access';

const mocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  findTenantVoting: vi.fn(),
}));

vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: mocks.findUserById,
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVoting: mocks.findTenantVoting,
}));

const OPEN = { id: 'v1', status: 'ACTIVE', endsAt: null };

describe('resolveOpenVoting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUserById.mockResolvedValue({ status: 'APPROVED' });
    mocks.findTenantVoting.mockResolvedValue(OPEN);
  });

  it('returns an open voting of an approved owner', async () => {
    expect(await resolveOpenVoting('user-1', 'v1')).toEqual({ voting: OPEN });
    expect(mocks.findTenantVoting).toHaveBeenCalledWith('user-1', 'v1');
  });

  it('refuses a non-string id before any lookup', async () => {
    expect(await resolveOpenVoting('user-1', 42)).toMatchObject({
      failure: { code: 'not-found' },
    });
    expect(mocks.findUserById).not.toHaveBeenCalled();
  });

  it.each([[null], [{ status: 'PENDING' }], [{ status: 'REJECTED' }]])(
    'refuses an account that is not approved: %j',
    async (user) => {
      mocks.findUserById.mockResolvedValue(user);

      expect(await resolveOpenVoting('user-1', 'v1')).toMatchObject({
        failure: { code: 'invalid' },
      });
      expect(mocks.findTenantVoting).not.toHaveBeenCalled();
    }
  );

  it('reports a voting the owner cannot see as not found', async () => {
    mocks.findTenantVoting.mockResolvedValue(null);

    expect(await resolveOpenVoting('user-1', 'v1')).toMatchObject({
      failure: { code: 'not-found' },
    });
  });

  it('refuses a voting that is closed or past its deadline', async () => {
    mocks.findTenantVoting.mockResolvedValue({
      ...OPEN,
      status: 'RESULTS_PUBLISHED',
    });
    expect(await resolveOpenVoting('user-1', 'v1')).toMatchObject({
      failure: { message: 'Głosowanie zostało zakończone' },
    });

    mocks.findTenantVoting.mockResolvedValue({ ...OPEN, endsAt: new Date(1) });
    expect(await resolveOpenVoting('user-1', 'v1')).toMatchObject({
      failure: { code: 'invalid' },
    });
  });
});
