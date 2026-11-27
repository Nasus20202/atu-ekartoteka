import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VotingsSection } from '@/components/dashboard/sections/votings-section';

const mocks = vi.hoisted(() => ({
  loadAccountUser: vi.fn(),
  findTenantVotings: vi.fn(),
}));

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: mocks.loadAccountUser,
}));
vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVotings: mocks.findTenantVotings,
}));

const VOTING = {
  id: 'v1',
  title: 'Remont dachu',
  status: 'ACTIVE',
  endsAt: null,
  hoa: { name: 'Lipowa', _count: { apartments: 1 } },
  _count: { questions: 2, ballots: 0 },
};

describe('VotingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadAccountUser.mockResolvedValue({
      id: 'user-1',
      status: 'APPROVED',
    });
    mocks.findTenantVotings.mockResolvedValue([VOTING]);
  });

  it('shows the votings of an approved owner', async () => {
    render((await VotingsSection())!);

    expect(screen.getByText('Remont dachu')).toBeInTheDocument();
    expect(mocks.findTenantVotings).toHaveBeenCalledWith('user-1');
  });

  it.each([[null], [{ id: 'user-1', status: 'PENDING' }]])(
    'shows nothing for an account without access: %j',
    async (account) => {
      mocks.loadAccountUser.mockResolvedValue(account);

      expect(await VotingsSection()).toBeNull();
      expect(mocks.findTenantVotings).not.toHaveBeenCalled();
    }
  );

  it('shows nothing when there are no votings', async () => {
    mocks.findTenantVotings.mockResolvedValue([]);

    expect(await VotingsSection()).toBeNull();
  });
});
