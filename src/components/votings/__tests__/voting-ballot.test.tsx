import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VotingBallot } from '@/components/votings/voting-ballot';

const mocks = vi.hoisted(() => ({ request: vi.fn(), confirm: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  requestVoteConfirmationAction: mocks.request,
  confirmVoteAction: mocks.confirm,
}));

const QUESTIONS = [
  { id: 'q1', position: 0, text: 'Czy remont?' },
  { id: 'q2', position: 1, text: 'Czy firma A?' },
];

describe('VotingBallot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });
    mocks.confirm.mockResolvedValue({ ok: true, data: { ballots: 1 } });
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

  it('walks from the answers through the emailed code to the confirmation', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VotingBallot votingId="v1" questions={QUESTIONS} apartmentCount={1} />
    );
    await user.click(screen.getAllByLabelText('Za')[0]);
    await user.click(screen.getAllByLabelText('Przeciw')[1]);
    await user.click(screen.getByRole('button', { name: /Dalej/ }));

    const code = await screen.findByLabelText('Kod z wiadomości');
    const confirm = screen.getByRole('button', {
      name: /Potwierdź i zagłosuj/,
    });
    expect(confirm).toBeDisabled();
    await user.type(code, '12ab34-56');
    expect(code).toHaveValue('123456');
    await user.click(confirm);

    expect(await screen.findByText('Dziękujemy, głos oddany')).toBeVisible();
    // The step swap is animated
    expect(
      container.querySelector('[class*="animate-view-switch"]')
    ).not.toBeNull();
  });

  it('shows the reason a wrong code was refused', async () => {
    mocks.confirm.mockResolvedValue({ ok: false, error: 'Nieprawidłowy kod' });
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
    await user.type(await screen.findByLabelText('Kod z wiadomości'), '000000');
    await user.click(
      screen.getByRole('button', { name: /Potwierdź i zagłosuj/ })
    );

    expect(await screen.findByText('Nieprawidłowy kod')).toBeVisible();
  });
});
