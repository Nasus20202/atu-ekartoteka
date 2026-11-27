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

describe('VotingBallot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });
  });

  it('blocks the next step until every question is answered', async () => {
    const user = userEvent.setup();
    render(
      <VotingBallot votingId="v1" questions={QUESTIONS} apartmentCount={1} />
    );
    const next = screen.getByRole('button', { name: /Dalej/ });

    expect(next).toBeDisabled();
    await user.click(screen.getAllByLabelText('Za')[0]);
    expect(next).toBeDisabled();
    await user.click(screen.getAllByLabelText('Wstrzymał(a) się')[1]);
    expect(next).toBeEnabled();
  });

  it('tells an owner of several apartments that every one gets the vote', () => {
    render(
      <VotingBallot votingId="v1" questions={QUESTIONS} apartmentCount={3} />
    );

    expect(screen.getByText(/Masz 3 lokale/)).toBeInTheDocument();
  });

  it('walks from the answers to the email step and back', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VotingBallot votingId="v1" questions={QUESTIONS} apartmentCount={1} />
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
        apartmentCount={1}
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
        apartmentCount={1}
      />
    );
    await user.click(screen.getByLabelText('Za'));
    await user.click(screen.getByRole('button', { name: /Dalej/ }));

    expect(
      await screen.findByText('Poczekaj 4 min przed ponownym wysłaniem linku')
    ).toBeVisible();
  });
});
