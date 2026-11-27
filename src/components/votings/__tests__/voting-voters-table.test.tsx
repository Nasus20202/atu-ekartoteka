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
            fromMeeting: false,
            apartment: { address: 'ul. Lipowa', building: '1', number: '2' },
            votedAt: '2026-06-01T10:00:00.000Z',
            answers: { q1: 'FOR' },
          },
        ]}
      />
    );

    // Both layouts are rendered; CSS shows the card list below md and the table above
    expect(screen.getAllByText('Anna Nowak')).toHaveLength(2);
    expect(screen.getAllByText('anna@example.com')).toHaveLength(2);
    expect(screen.getAllByText('ul. Lipowa 1/2')).toHaveLength(2);
    expect(screen.getAllByText('1. Za')[0]).toHaveAttribute(
      'title',
      'Pierwsze'
    );
    // A question without a stored answer shows a dash instead of a choice
    expect(screen.getAllByText('2. —')).toHaveLength(2);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('marks a vote entered after a meeting instead of an email', () => {
    render(
      <VotingVotersTable
        questions={[]}
        voters={[
          {
            ballotId: 'm',
            voterName: 'Jan',
            voterEmail: null,
            fromMeeting: true,
            apartment: { address: 'Lipowa', building: '1', number: '3' },
            votedAt: '2026-06-01T10:00:00.000Z',
            answers: {},
          },
        ]}
      />
    );

    expect(screen.getAllByText('Z zebrania').length).toBeGreaterThan(0);
  });
});
