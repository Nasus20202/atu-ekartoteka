import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VotingResults } from '@/components/votings/voting-results';

describe('VotingResults', () => {
  it('shows count and percent for every choice of every question', () => {
    render(
      <VotingResults
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
});
