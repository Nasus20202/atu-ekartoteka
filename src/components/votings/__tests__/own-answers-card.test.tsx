import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OwnAnswersCard } from '@/components/votings/own-answers-card';

describe('OwnAnswersCard', () => {
  it('confirms the vote and lists the own answers, with a dash for a missing one', () => {
    render(
      <OwnAnswersCard
        questions={[
          { id: 'q1', position: 0, text: 'Pierwsze' },
          { id: 'q2', position: 1, text: 'Drugie' },
        ]}
        answers={{ q1: 'ABSTAIN' }}
      />
    );

    expect(
      screen.getByText('Twój głos został oddany i potwierdzony')
    ).toBeInTheDocument();
    expect(screen.getByText('Wstrzymał(a) się')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
