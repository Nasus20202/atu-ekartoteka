import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OwnAnswersCard } from '@/components/votings/own-answers-card';

const QUESTIONS = [
  { id: 'q1', position: 0, text: 'Pierwsze' },
  { id: 'q2', position: 1, text: 'Drugie' },
];

describe('OwnAnswersCard', () => {
  it.each([
    [false, 'Lokal Lipowa 1/2: Twój głos został oddany i potwierdzony'],
    [
      true,
      'Lokal Lipowa 1/2: głos oddany na zebraniu i wpisany przez zarządcę',
    ],
  ])(
    'names the apartment and how it voted (meeting: %s), with a dash for a missing answer',
    (fromMeeting, message) => {
      render(
        <OwnAnswersCard
          questions={QUESTIONS}
          ballot={{
            id: 'b1',
            apartment: 'Lipowa 1/2',
            fromMeeting,
            answers: { q1: 'ABSTAIN' },
          }}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText('Wstrzymał(a) się')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    }
  );
});
