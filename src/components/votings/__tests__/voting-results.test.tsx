import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VotingResults } from '@/components/votings/voting-results';
import { voteChoices } from '@/lib/voting/rules/voting-status';

describe('VotingResults', () => {
  it('shows count and percent for every choice of every question', () => {
    render(
      <VotingResults
        choices={voteChoices(true)}
        results={[
          {
            questionId: 'q1',
            text: 'Czy remont?',
            counts: { FOR: 3, AGAINST: 1, ABSTAIN: 0 },
            total: 4,
          },
        ]}
      />
    );

    expect(screen.getByText('Czy remont?')).toBeInTheDocument();
    expect(screen.getByText('3 (75%)')).toBeInTheDocument();
    expect(screen.getByText('1 (25%)')).toBeInTheDocument();
    expect(screen.getByText('0 (0%)')).toBeInTheDocument();
    expect(screen.getByText('Oddanych głosów: 4')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Za: 75%' })
    ).toHaveAttribute('aria-valuenow', '75');
  });

  it('shows empty bars when nobody voted', () => {
    render(
      <VotingResults
        choices={voteChoices(true)}
        results={[
          {
            questionId: 'q1',
            text: 'Pytanie',
            counts: { FOR: 0, AGAINST: 0, ABSTAIN: 0 },
            total: 0,
          },
        ]}
      />
    );

    expect(screen.getAllByText('0 (0%)')).toHaveLength(3);
  });

  it('leaves abstaining out of a voting that blocks it', () => {
    render(
      <VotingResults
        choices={voteChoices(false)}
        results={[
          {
            questionId: 'q1',
            text: 'Pytanie',
            counts: { FOR: 1, AGAINST: 0, ABSTAIN: 0 },
            total: 1,
          },
        ]}
      />
    );

    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.queryByText('Wstrzymał(a) się')).not.toBeInTheDocument();
  });
});
