import { render, screen } from '@testing-library/react';
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

describe('VotingBallot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });
  });

  it('blocks the next step until every question is answered', async () => {
    const user = userEvent.setup();
    render(
      <VotingBallot
        votingId="v1"
        questions={QUESTIONS}
        allowAbstain
        apartments={[FIRST]}
        severalOwned={false}
      />
    );
    const next = screen.getByRole('button', { name: /Dalej/ });

    expect(next).toBeDisabled();
    await user.click(screen.getAllByLabelText('Za')[0]);
    expect(next).toBeDisabled();
    await user.click(screen.getAllByLabelText('Wstrzymał(a) się')[1]);
    expect(next).toBeEnabled();
  });

  it('walks from the answers to the email step and back', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VotingBallot
        votingId="v1"
        questions={QUESTIONS}
        allowAbstain
        apartments={[FIRST]}
        severalOwned={false}
      />
    );
    await user.click(screen.getAllByLabelText('Za')[0]);
    await user.click(screen.getAllByLabelText('Przeciw')[1]);
    await user.click(screen.getByRole('button', { name: /Dalej/ }));

    expect(
      await screen.findByText('Sprawdź swoją skrzynkę email')
    ).toBeVisible();
    // The step swap is animated
    expect(
      container.querySelector('[class*="animate-view-switch"]')
    ).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Zmień odpowiedzi' }));
    expect(screen.getAllByLabelText('Za')[0]).toBeChecked();
  });

  it('sends another link on request', async () => {
    const user = userEvent.setup();
    render(
      <VotingBallot
        votingId="v1"
        questions={[QUESTIONS[0]]}
        allowAbstain
        apartments={[FIRST]}
        severalOwned={false}
      />
    );
    await user.click(screen.getByLabelText('Za'));
    await user.click(screen.getByRole('button', { name: /Dalej/ }));
    await user.click(
      await screen.findByRole('button', { name: 'Wyślij link ponownie' })
    );

    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it('shows the reason the link was refused', async () => {
    mocks.request.mockResolvedValue({
      ok: false,
      error: 'Poczekaj 4 min przed ponownym wysłaniem linku',
    });
    const user = userEvent.setup();
    render(
      <VotingBallot
        votingId="v1"
        questions={[QUESTIONS[0]]}
        allowAbstain
        apartments={[FIRST]}
        severalOwned={false}
      />
    );
    await user.click(screen.getByLabelText('Za'));
    await user.click(screen.getByRole('button', { name: /Dalej/ }));

    expect(
      await screen.findByText('Poczekaj 4 min przed ponownym wysłaniem linku')
    ).toBeVisible();
  });

  it('offers no abstaining when the voting blocks it', () => {
    render(
      <VotingBallot
        votingId="v1"
        questions={QUESTIONS}
        allowAbstain={false}
        apartments={[FIRST]}
        severalOwned={false}
      />
    );

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(
      screen.queryByRole('radio', { name: 'Wstrzymał(a) się' })
    ).not.toBeInTheDocument();
  });
});
