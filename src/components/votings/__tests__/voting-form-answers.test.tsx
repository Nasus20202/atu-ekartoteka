import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VotingForm } from '@/components/votings/voting-form';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/actions/voting/admin-votings', () => ({
  createVotingAction: mocks.create,
  updateVotingAction: mocks.update,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const HOAS = [
  { id: 'h1', name: 'Lipowa' },
  { id: 'h2', name: 'Klonowa' },
];
const NEW_VOTING = {
  hoaId: '',
  title: '',
  description: '',
  endsAt: null,
  allowAbstain: true,
  questions: [],
};

describe('VotingForm: accepted answers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ ok: true, data: { id: 'v1' } });
  });

  it('blocks abstaining only when the admin ticks the option', async () => {
    const user = userEvent.setup();
    render(<VotingForm hoas={HOAS} initial={NEW_VOTING} />);
    const toggle = screen.getByRole('checkbox', {
      name: 'Zablokuj odpowiedź „Wstrzymał(a) się”',
    });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Utwórz głosowanie' }));

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ allowAbstain: false })
    );
  });

  it('shows the option of a draft that blocks abstaining as ticked', () => {
    render(
      <VotingForm
        hoas={HOAS}
        initial={{ ...NEW_VOTING, votingId: 'v1', allowAbstain: false }}
      />
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('keeps the answers of a draft with ballots fixed, and says why', () => {
    render(
      <VotingForm
        hoas={HOAS}
        initial={{
          ...NEW_VOTING,
          votingId: 'v1',
          questions: ['Czy?'],
          locked: true,
        }}
      />
    );

    expect(screen.getByText(/są głosy z zebrania/)).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Treść pytania 1' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Dodaj pytanie' })
    ).toBeDisabled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Wspólnota' })).toBeDisabled();
    expect(screen.getByLabelText('Tytuł')).toBeEnabled();
  });
});
