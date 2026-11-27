import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TenantVotingDetail } from '@/components/votings/tenant-voting-detail';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findTenantVoting: vi.fn(),
  countVoterApartments: vi.fn(),
  findVotableApartments: vi.fn(),
  findOwnBallots: vi.fn(),
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
  countVoterApartments: mocks.countVoterApartments,
  findVotableApartments: mocks.findVotableApartments,
  findOwnBallots: mocks.findOwnBallots,
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
    allowAbstain: true,
    hoa: { id: 'h1', name: 'Lipowa' },
    questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
  };
}

const votable = {
  id: 'a2',
  address: 'Lipowa',
  building: '1',
  number: '3',
};

/** The user owns `owned` apartments, of which `waiting` have not voted. */
function apartments(owned: number, waiting: number) {
  mocks.countVoterApartments.mockResolvedValue(owned);
  mocks.findVotableApartments.mockResolvedValue(waiting ? [votable] : []);
}

const ballot = (choice: string, userId: string | null = 'user-1') => ({
  id: `b-${choice}`,
  userId,
  apartment: { address: 'Lipowa', building: '1', number: '2' },
  votes: [{ questionId: 'q1', choice }],
});

describe('TenantVotingDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
    mocks.findTenantVoting.mockResolvedValue(voting());
    apartments(1, 1);
    mocks.findOwnBallots.mockResolvedValue([]);
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
      expect.objectContaining({
        votingId: 'v1',
        apartments: [{ id: 'a2', label: 'Lipowa 1/3' }],
        severalOwned: false,
      })
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('offers the ballot only for the apartments that have not voted', async () => {
    apartments(2, 1);
    mocks.findOwnBallots.mockResolvedValue([ballot('FOR')]);

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(mocks.ballot).toHaveBeenCalledWith(
      expect.objectContaining({ severalOwned: true })
    );
    expect(
      screen.getByText(
        'Lokal Lipowa 1/2: Twój głos został oddany i potwierdzony'
      )
    ).toBeInTheDocument();
  });

  it('shows the own answers and no ballot once every apartment voted', async () => {
    apartments(1, 0);
    mocks.findOwnBallots.mockResolvedValue([ballot('AGAINST')]);

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
  });

  it('shows a closed voting its state and own answers, never results', async () => {
    mocks.findTenantVoting.mockResolvedValue(voting('CLOSED'));
    apartments(1, 0);
    mocks.findOwnBallots.mockResolvedValue([ballot('FOR')]);

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(screen.getByText('Zakończone')).toBeInTheDocument();
    expect(
      screen.getByText(/Głosowanie zostało zakończone/)
    ).toBeInTheDocument();
    expect(screen.getByText('Za')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('ballot')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Termin głosowania minął/)
    ).not.toBeInTheDocument();
  });

  it('shows the vote an admin entered after a meeting', async () => {
    apartments(1, 0);
    mocks.findOwnBallots.mockResolvedValue([ballot('AGAINST', null)]);

    render(await TenantVotingDetail({ votingId: 'v1' }));

    expect(
      screen.getByText(
        'Lokal Lipowa 1/2: głos oddany na zebraniu i wpisany przez zarządcę'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('ballot')).not.toBeInTheDocument();
  });
});
