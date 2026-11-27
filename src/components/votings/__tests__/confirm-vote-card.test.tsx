import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmVoteCard } from '@/components/votings/confirm-vote-card';

const mocks = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  confirmVoteAction: mocks.confirm,
}));

const QUESTIONS = [
  { id: 'q1', position: 0, text: 'Czy remont?' },
  { id: 'q2', position: 1, text: 'Czy firma A?' },
];

function renderCard() {
  return render(
    <ConfirmVoteCard
      token="tok"
      votingTitle="Remont dachu"
      questions={QUESTIONS}
      ballots={[
        {
          apartmentId: 'a1',
          apartment: 'Lipowa 1/1',
          answers: { q1: 'FOR', q2: 'AGAINST' },
        },
        {
          apartmentId: 'a2',
          apartment: 'Lipowa 1/2',
          answers: { q1: 'ABSTAIN', q2: 'ABSTAIN' },
        },
      ]}
    />
  );
}

describe('ConfirmVoteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue({
      ok: true,
      data: { ballots: 2, votingId: 'v1' },
    });
  });

  it('shows the answers about to be confirmed', () => {
    renderCard();

    expect(screen.getByText('Remont dachu')).toBeVisible();
    expect(screen.getAllByText('1. Czy remont?')).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: 'Lokal Lipowa 1/2' })
    ).toBeVisible();
    expect(screen.getAllByText('Wstrzymał(a) się')).toHaveLength(2);
    expect(screen.getByText('Za')).toBeVisible();
    expect(screen.getByText('Przeciw')).toBeVisible();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('casts the vote only after the button is pressed', async () => {
    const user = userEvent.setup();
    const { container } = renderCard();

    await user.click(
      screen.getByRole('button', { name: 'Potwierdź i zagłosuj' })
    );

    expect(mocks.confirm).toHaveBeenCalledWith({ token: 'tok' });
    expect(await screen.findByText('Dziękujemy, głos oddany')).toBeVisible();
    expect(
      screen.getByText('Zapisaliśmy Twój głos dla 2 lokali.')
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Wróć do głosowań' })
    ).toHaveAttribute('href', '/dashboard/votings');
    // The swap from review to done is animated
    expect(
      container.querySelector('[class*="animate-view-switch"]')
    ).not.toBeNull();
  });

  it('keeps the review and shows why the link was refused', async () => {
    mocks.confirm.mockResolvedValue({ ok: false, error: 'Link wygasł' });
    const user = userEvent.setup();
    renderCard();

    await user.click(
      screen.getByRole('button', { name: 'Potwierdź i zagłosuj' })
    );

    expect(await screen.findByText('Link wygasł')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Potwierdź i zagłosuj' })
    ).toBeEnabled();
  });
});
