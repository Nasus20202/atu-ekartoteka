import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  type ConfirmableVote,
  VoteConfirmationView,
} from '@/components/votings/vote-confirmation-view';
import { generateConfirmationToken } from '@/lib/voting/rules/confirmation-token';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import { VoteChoice } from '@/lib/voting/types/voting';

vi.mock('@/components/votings/confirm-vote-card', () => ({
  ConfirmVoteCard: (props: { votingTitle: string; token: string }) => (
    <div>
      card {props.votingTitle} {props.token}
    </div>
  ),
}));

const TOKEN = generateConfirmationToken();
const UNUSABLE = /Ten link jest nieprawidłowy/;

const LINK: ConfirmableVote = {
  token: TOKEN,
  votingTitle: 'Remont dachu',
  questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
  ballots: [
    {
      apartmentId: 'a1',
      apartment: 'Lipowa 1/1',
      answers: { q1: VoteChoice.FOR },
    },
  ],
};

describe('VoteConfirmationView', () => {
  it('asks the owner to confirm the stored answers', () => {
    render(<VoteConfirmationView link={LINK} />);

    expect(screen.getByText(`card Remont dachu ${TOKEN}`)).toBeVisible();
    expect(screen.queryByText(UNUSABLE)).not.toBeInTheDocument();
  });

  it('explains that the link cannot be used and offers the way back', () => {
    render(<VoteConfirmationView link={null} />);

    expect(screen.getByText(UNUSABLE)).toBeVisible();
    expect(screen.queryByText(/^card/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Wróć do głosowań' })
    ).toHaveAttribute('href', VOTING_PATHS.tenant);
  });
});
