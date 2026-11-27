import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TenantVotingDetail } from '@/components/votings/tenant-voting-detail';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findTenantVoting: vi.fn(),
  findVoterApartments: vi.fn(),
  findOwnBallot: vi.fn(),
  countVotingResults: vi.fn(),
  ballot: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/framework/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireApprovedTenant,
}));
vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVoting: mocks.findTenantVoting,
}));
vi.mock('@/lib/voting/queries/find-voter-apartments', () => ({
  findVoterApartments: mocks.findVoterApartments,
  findOwnBallot: mocks.findOwnBallot,
}));
vi.mock('@/lib/voting/queries/count-voting-results', () => ({
  countVotingResults: mocks.countVotingResults,
}));
vi.mock('@/components/votings/voting-ballot', () => ({
  VotingBallot: (props: unknown) => {
    mocks.ballot(props);
    return <div>ballot</div>;
  },
}));

function voting(status = 'ACTIVE', endsAt: Date | null = null) {
  return {
    id: 'v1',
    title: 'Remont dachu',
    description: null,
    status,
    endsAt,
    hoa: { id: 'h1', name: 'Lipowa' },
    questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
  };
}

const apartment = (voted: boolean) => ({
  id: voted ? 'a1' : 'a2',
  votingBallots: voted ? [{ id: 'b' }] : [],
});

describe('TenantVotingDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
    mocks.findTenantVoting.mockResolvedValue(voting());
    mocks.findVoterApartments.mockResolvedValue([apartment(false)]);
    mocks.findOwnBallot.mockResolvedValue(null);
    mocks.countVotingResults.mockResolvedValue([
      { questionId: 'q1', choice: 'FOR', count: 2 },
    ]);
  });

  it('is not found when the voting is not visible to the owner', async () => {
    mocks.findTenantVoting.mockResolvedValue(null);

    await expect(TenantVotingDetail({ votingId: 'v1' })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(mocks.findTenantVoting).toHaveBeenCalledWith('user-1', 'v1');
  });

  it('shows the ballot to an owner who has not voted, without results', async () => {
    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(screen.getByText('ballot')).toBeInTheDocument();
    expect(mocks.ballot).toHaveBeenCalledWith(
      expect.objectContaining({ votingId: 'v1', apartmentCount: 1 })
    );
    expect(mocks.countVotingResults).not.toHaveBeenCalled();
  });

  it('offers the ballot only for the apartments that have not voted', async () => {
    mocks.findVoterApartments.mockResolvedValue([
      apartment(true),
      apartment(false),
    ]);
    mocks.findOwnBallot.mockResolvedValue({
      votes: [{ questionId: 'q1', choice: 'FOR' }],
    });

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(mocks.ballot).toHaveBeenCalledWith(
      expect.objectContaining({ apartmentCount: 1 })
    );
    expect(
      screen.getByText('Twój głos został oddany i potwierdzony')
    ).toBeInTheDocument();
  });

  it('shows the own answers and no ballot once every apartment voted', async () => {
    mocks.findVoterApartments.mockResolvedValue([apartment(true)]);
    mocks.findOwnBallot.mockResolvedValue({
      votes: [{ questionId: 'q1', choice: 'AGAINST' }],
    });

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(screen.queryByText('ballot')).not.toBeInTheDocument();
    expect(screen.getByText('Przeciw')).toBeInTheDocument();
  });

  it('explains a passed deadline and shows neither ballot nor results', async () => {
    mocks.findTenantVoting.mockResolvedValue(
      voting('ACTIVE', new Date('2026-05-01T10:00:00Z'))
    );

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(screen.getByText(/Termin głosowania minął/)).toBeInTheDocument();
    expect(screen.getByText(/Zakończono:/)).toBeInTheDocument();
    expect(screen.queryByText('ballot')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(mocks.countVotingResults).not.toHaveBeenCalled();
  });

  it('shows aggregate results once they are published', async () => {
    mocks.findTenantVoting.mockResolvedValue(voting('RESULTS_PUBLISHED'));

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
    expect(screen.getByText('2 (100%)')).toBeInTheDocument();
    expect(screen.queryByText('ballot')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Termin głosowania minął/)
    ).not.toBeInTheDocument();
  });
});
