import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VotingsCard } from '@/components/dashboard/votings-card';
import { TenantVotingCard } from '@/components/votings/tenant-voting-card';
import type { TenantVotingDto } from '@/lib/voting/dto/tenant-voting-dto';

function voting(overrides: Partial<TenantVotingDto> = {}): TenantVotingDto {
  return {
    id: 'v1',
    title: 'Remont dachu',
    status: 'ACTIVE',
    endsAt: null,
    hoaName: 'Wspólnota Lipowa',
    questionCount: 2,
    apartmentCount: 2,
    votedApartmentCount: 0,
    open: true,
    awaitingVote: true,
    ...overrides,
  };
}

describe('TenantVotingCard', () => {
  it('invites an owner who has not voted to vote', () => {
    render(<TenantVotingCard voting={voting()} />);

    expect(screen.getByText('Czeka na Twój głos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Zagłosuj/ })).toHaveAttribute(
      'href',
      '/dashboard/votings/v1'
    );
  });

  it('shows progress and no invitation once every apartment voted', () => {
    render(
      <TenantVotingCard
        voting={voting({ awaitingVote: false, votedApartmentCount: 2 })}
      />
    );

    expect(screen.queryByText('Czeka na Twój głos')).not.toBeInTheDocument();
    expect(screen.getByText(/Oddane głosy: 2 z 2/)).toBeInTheDocument();
  });

  it('says the voting has ended once the deadline passed, without inviting to vote', () => {
    render(
      <TenantVotingCard
        voting={voting({
          endsAt: '2026-05-01T10:00:00.000Z',
          open: false,
          awaitingVote: false,
        })}
      />
    );

    expect(screen.getByText(/Zakończono:/)).toBeInTheDocument();
    expect(screen.queryByText('Czeka na Twój głos')).not.toBeInTheDocument();
  });

  it('links to the results when they are published', () => {
    render(
      <TenantVotingCard
        voting={voting({ status: 'RESULTS_PUBLISHED', awaitingVote: false })}
      />
    );

    expect(
      screen.getByRole('link', { name: /Zobacz wyniki/ })
    ).toBeInTheDocument();
  });
});

describe('VotingsCard', () => {
  it('counts the votings waiting for the owner', () => {
    render(
      <VotingsCard
        votings={[voting(), voting({ id: 'v2', awaitingVote: false })]}
      />
    );

    expect(screen.getByText('Czeka na Twój głos: 1')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('says so when every vote has been cast', () => {
    render(<VotingsCard votings={[voting({ awaitingVote: false })]} />);

    expect(
      screen.getByText('Oddałeś głosy we wszystkich aktywnych głosowaniach')
    ).toBeInTheDocument();
  });
});
