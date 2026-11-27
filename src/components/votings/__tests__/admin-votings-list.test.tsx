import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminVotingsList } from '@/components/votings/admin-votings-list';
import { ListViewMode } from '@/lib/shared/list-view-mode';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  findAdminVotings: vi.fn(),
  findHoas: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/voting/queries/find-admin-votings', () => ({
  findAdminVotings: mocks.findAdminVotings,
}));
vi.mock('@/lib/hoa/queries/find-hoas', () => ({ findHoas: mocks.findHoas }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/votings',
  useSearchParams: () => new URLSearchParams(),
}));

const list = (searchParams: Record<string, string> = {}) =>
  AdminVotingsList({
    searchParams: Promise.resolve(searchParams),
    viewMode: ListViewMode.CARDS,
  });

describe('AdminVotingsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.findHoas.mockResolvedValue([]);
  });

  it('guards the list with the admin check', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(list()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.findAdminVotings).not.toHaveBeenCalled();
  });

  it('shows an empty state without votings', async () => {
    mocks.findAdminVotings.mockResolvedValue([]);

    render(await list());

    expect(screen.getByText('Brak głosowań')).toBeInTheDocument();
  });

  it('asks the database for the filters named in the address', async () => {
    mocks.findAdminVotings.mockResolvedValue([]);

    render(await list({ status: 'ACTIVE', hoa: 'h1' }));

    expect(mocks.findAdminVotings).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE', hoaId: 'h1' })
    );
    expect(screen.getByText('Brak pasujących głosowań')).toBeInTheDocument();
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

    render(await list());

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

  it('offers the associations in the filter', async () => {
    mocks.findHoas.mockResolvedValue([{ id: 'h1', name: 'Lipowa' }]);
    mocks.findAdminVotings.mockResolvedValue([]);

    render(await list({ hoa: 'h1' }));

    expect(
      screen.getByRole('button', { name: 'Filtr wspólnoty' })
    ).toHaveAccessibleDescription('Lipowa');
  });
});
