import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminVotingsList } from '@/components/votings/admin-votings-list';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  findAdminVotings: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/voting/queries/find-admin-votings', () => ({
  findAdminVotings: mocks.findAdminVotings,
}));

describe('AdminVotingsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
  });

  it('guards the list with the admin check', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(AdminVotingsList()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.findAdminVotings).not.toHaveBeenCalled();
  });

  it('shows an empty state without votings', async () => {
    mocks.findAdminVotings.mockResolvedValue([]);

    render(await AdminVotingsList());

    expect(screen.getByText('Brak głosowań')).toBeInTheDocument();
  });

  it('links every voting to its page with status, HOA and counts', async () => {
    mocks.findAdminVotings.mockResolvedValue([
      {
        id: 'v1',
        title: 'Remont dachu',
        status: 'ACTIVE',
        endsAt: new Date('2026-12-01T10:00:00Z'),
        createdAt: new Date('2026-06-01T10:00:00Z'),
        hoa: { id: 'h1', name: 'Wspólnota Lipowa' },
        _count: { questions: 3, ballots: 7 },
      },
    ]);

    render(await AdminVotingsList());

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/admin/votings/v1'
    );
    expect(screen.getByText('Remont dachu')).toBeInTheDocument();
    expect(screen.getByText('Aktywne')).toBeInTheDocument();
    expect(screen.getByText('Wspólnota Lipowa')).toBeInTheDocument();
    expect(
      screen.getByText(/Pytania: 3 · Oddane głosy: 7/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Termin:/)).toBeInTheDocument();
  });
});
