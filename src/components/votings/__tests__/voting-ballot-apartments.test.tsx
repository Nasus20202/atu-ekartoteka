import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VotingBallot } from '@/components/votings/voting-ballot';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  requestVoteConfirmationAction: mocks.request,
}));

const QUESTIONS = [
  { id: 'q1', position: 0, text: 'Czy remont?' },
  { id: 'q2', position: 1, text: 'Czy firma A?' },
];

const FIRST = { id: 'a1', label: 'Lipowa 1/1' };
const SECOND = { id: 'a2', label: 'Lipowa 1/2' };

describe('VotingBallot: several apartments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });
  });

  it('asks each apartment for its own answers', async () => {
    const user = userEvent.setup();
    render(
      <VotingBallot
        votingId="v1"
        questions={[QUESTIONS[0]]}
        allowAbstain
        apartments={[FIRST, SECOND]}
        severalOwned
      />
    );
    expect(screen.getByText(/Każdy lokal głosuje osobno/)).toBeInTheDocument();
    const first = within(
      screen.getByRole('region', { name: 'Lokal Lipowa 1/1' })
    );
    const second = within(
      screen.getByRole('region', { name: 'Lokal Lipowa 1/2' })
    );

    await user.click(first.getByLabelText('Za'));
    await user.click(second.getByLabelText('Przeciw'));
    // The other apartment's choice does not replace the first one
    expect(first.getByLabelText('Za')).toBeChecked();
    await user.click(screen.getByRole('button', { name: /Dalej/ }));

    expect(mocks.request).toHaveBeenCalledWith({
      votingId: 'v1',
      answers: { a1: { q1: 'FOR' }, a2: { q1: 'AGAINST' } },
    });
  });

  it('lets an unfinished apartment be cleared and voted later', async () => {
    const user = userEvent.setup();
    render(
      <VotingBallot
        votingId="v1"
        questions={QUESTIONS}
        allowAbstain
        apartments={[FIRST, SECOND]}
        severalOwned
      />
    );
    const first = within(
      screen.getByRole('region', { name: 'Lokal Lipowa 1/1' })
    );
    const second = within(
      screen.getByRole('region', { name: 'Lokal Lipowa 1/2' })
    );
    await user.click(first.getAllByLabelText('Za')[0]);
    await user.click(first.getAllByLabelText('Za')[1]);
    await user.click(second.getAllByLabelText('Za')[0]);
    const next = screen.getByRole('button', { name: /Dalej/ });
    expect(next).toBeDisabled();

    await user.click(second.getByRole('button', { name: 'Wyczyść' }));

    expect(next).toBeEnabled();
    expect(second.getAllByLabelText('Za')[0]).not.toBeChecked();
  });

  it('names the apartment left to an owner of several', () => {
    render(
      <VotingBallot
        votingId="v1"
        questions={QUESTIONS}
        allowAbstain
        apartments={[SECOND]}
        severalOwned
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Lokal Lipowa 1/2' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Każdy lokal/)).not.toBeInTheDocument();
  });
});
