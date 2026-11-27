import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminVotingDetail } from '@/components/votings/admin-voting-detail';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  findVotingById: vi.fn(),
  countVotingResults: vi.fn(),
  findVotingBallots: vi.fn(),
  findEligibleVoters: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/framework/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));
vi.mock('@/lib/voting/queries/find-voting-by-id', () => ({
  findVotingById: mocks.findVotingById,
}));
vi.mock('@/lib/voting/queries/count-voting-results', () => ({
  countVotingResults: mocks.countVotingResults,
}));
vi.mock('@/lib/voting/queries/find-voting-ballots', () => ({
  findVotingBallots: mocks.findVotingBallots,
}));
vi.mock('@/lib/voting/queries/find-eligible-voters', () => ({
  findEligibleVoters: mocks.findEligibleVoters,
}));
vi.mock('@/components/votings/voting-status-actions', () => ({
  VotingStatusActions: ({ status }: { status: string }) => (
    <div>actions-{status}</div>
  ),
}));
vi.mock('@/components/votings/notify-voters-dialog', () => ({
  NotifyVotersDialog: () => <div>notify-dialog</div>,
}));

function voting(status: string, endsAt: Date | null = null) {
  return {
    id: 'v1',
    title: 'Remont dachu',
    description: 'Opis głosowania',
    status,
    endsAt,
    hoa: { id: 'h1', name: 'Lipowa' },
    questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
  };
}

describe('AdminVotingDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.countVotingResults.mockResolvedValue([
      { questionId: 'q1', choice: 'FOR', count: 1 },
    ]);
    mocks.findVotingBallots.mockResolvedValue([
      {
        id: 'b1',
        createdAt: new Date('2026-06-01T10:00:00Z'),
        user: { name: 'Anna', email: 'anna@example.com' },
        apartment: { address: 'Lipowa', building: '1', number: '2' },
        votes: [{ questionId: 'q1', choice: 'FOR' }],
      },
    ]);
    mocks.findEligibleVoters.mockResolvedValue([
      {
        id: 'u1',
        name: 'Anna',
        email: 'anna@example.com',
        _count: { apartments: 2 },
        votingBallots: [{ id: 'b1' }],
      },
    ]);
  });

  it('is not found for an unknown voting', async () => {
    mocks.findVotingById.mockResolvedValue(null);

    await expect(AdminVotingDetail({ votingId: 'v1' })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });

  it('shows a draft with its questions and no results', async () => {
    mocks.findVotingById.mockResolvedValue(voting('DRAFT'));

    render(await AdminVotingDetail({ votingId: 'v1' }));

    expect(screen.getByText('Remont dachu')).toBeInTheDocument();
    expect(screen.getByText('Czy zgadzasz się?')).toBeInTheDocument();
    expect(screen.getByText('actions-DRAFT')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByText('notify-dialog')).not.toBeInTheDocument();
  });

  it('shows turnout, tabs and the notify button for an open voting', async () => {
    mocks.findVotingById.mockResolvedValue(voting('ACTIVE'));

    render(await AdminVotingDetail({ votingId: 'v1' }));

    expect(screen.getByText('Oddane głosy').nextSibling).toHaveTextContent('1');
    expect(screen.getByText('Uprawnione lokale').nextSibling).toHaveTextContent(
      '2'
    );
    expect(screen.getByText('Frekwencja').nextSibling).toHaveTextContent('50%');
    expect(screen.getByRole('tab', { name: 'Wyniki' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Kto jak głosował' })
    ).toBeInTheDocument();
    expect(screen.getByText('notify-dialog')).toBeInTheDocument();
  });

  it('flags a passed deadline and stops offering notifications', async () => {
    mocks.findVotingById.mockResolvedValue(
      voting('ACTIVE', new Date('2020-01-01T10:00:00Z'))
    );

    render(await AdminVotingDetail({ votingId: 'v1' }));

    expect(screen.getByText(/Zakończono:/)).toBeInTheDocument();
    expect(screen.queryByText('notify-dialog')).not.toBeInTheDocument();
  });

  it('does not offer notifications once results are published', async () => {
    mocks.findVotingById.mockResolvedValue(voting('RESULTS_PUBLISHED'));

    render(await AdminVotingDetail({ votingId: 'v1' }));

    expect(screen.queryByText('notify-dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/Zakończono:/)).not.toBeInTheDocument();
  });
});
