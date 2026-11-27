import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VotingVotersTable } from '@/components/votings/voting-voters-table';

const QUESTIONS = [
  { id: 'q1', position: 0, text: 'Pierwsze' },
  { id: 'q2', position: 1, text: 'Drugie' },
];

describe('VotingVotersTable', () => {
  it('says so when nobody voted yet', () => {
    render(<VotingVotersTable voters={[]} questions={QUESTIONS} />);

    expect(
      screen.getByText('Nikt jeszcze nie zagłosował.')
    ).toBeInTheDocument();
  });

  it('lists every apartment with the voter and a short answer per question', () => {
    render(
      <VotingVotersTable
        questions={QUESTIONS}
        voters={[
          {
            ballotId: 'b1',
            voterName: 'Anna Nowak',
            voterEmail: 'anna@example.com',
            apartment: { address: 'ul. Lipowa', building: '1', number: '2' },
            votedAt: '2026-06-01T10:00:00.000Z',
            answers: { q1: 'FOR' },
          },
        ]}
      />
    );

    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    expect(screen.getByText('ul. Lipowa 1/2')).toBeInTheDocument();
    expect(screen.getByText('1. Za')).toHaveAttribute('title', 'Pierwsze');
    // A question without a stored answer shows a dash instead of a choice
    expect(screen.getByText('2. —')).toBeInTheDocument();
  });
});
