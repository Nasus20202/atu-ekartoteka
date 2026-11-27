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

describe('VotingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ ok: true, data: { id: 'v1' } });
    mocks.update.mockResolvedValue({ ok: true, data: { id: 'v1' } });
  });

  it('creates a voting from the filled form', async () => {
    const user = userEvent.setup();
    render(<VotingForm initial={NEW_VOTING} hoas={HOAS} />);

    await user.click(screen.getByLabelText('Wspólnota'));
    await user.click(await screen.findByRole('option', { name: 'Klonowa' }));
    await user.type(screen.getByLabelText('Tytuł'), 'Remont');
    await user.type(screen.getByLabelText('Opis (opcjonalnie)'), 'Opis');
    await user.type(
      screen.getByRole('textbox', { name: 'Treść pytania 1' }),
      'Czy?'
    );
    await user.click(screen.getByRole('button', { name: 'Utwórz głosowanie' }));

    expect(mocks.create).toHaveBeenCalledWith({
      hoaId: 'h2',
      title: 'Remont',
      description: 'Opis',
      endsAt: null,
      allowAbstain: true,
      questions: [{ text: 'Czy?' }],
    });
    expect(mocks.push).toHaveBeenCalledWith('/admin/votings/v1');
  });

  it('sends the picked deadline in the zone of the browser', async () => {
    const user = userEvent.setup();
    render(
      <VotingForm
        hoas={HOAS}
        initial={{ ...NEW_VOTING, endsAt: '2026-12-01T10:00:00.000Z' }}
      />
    );

    await user.click(screen.getByLabelText('Termin zakończenia (opcjonalnie)'));
    await user.click(screen.getByRole('button', { name: '15 grudnia 2026' }));
    await user.click(screen.getByRole('button', { name: 'Gotowe' }));
    await user.click(screen.getByRole('button', { name: 'Utwórz głosowanie' }));

    const chosen = new Date('2026-12-01T10:00:00.000Z');
    chosen.setDate(15);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ endsAt: chosen.toISOString() })
    );
  });

  it('shows the reason when saving is refused', async () => {
    mocks.create.mockResolvedValue({
      ok: false,
      error: 'Podaj tytuł głosowania',
    });
    const user = userEvent.setup();
    render(<VotingForm initial={NEW_VOTING} hoas={HOAS} />);

    await user.click(screen.getByRole('button', { name: 'Utwórz głosowanie' }));

    expect(await screen.findByText('Podaj tytuł głosowania')).toBeVisible();
  });

  it('edits a draft and cancels back to it', async () => {
    const user = userEvent.setup();
    render(
      <VotingForm
        hoas={HOAS}
        initial={{
          votingId: 'v1',
          hoaId: 'h1',
          title: 'Remont',
          description: '',
          endsAt: null,
          allowAbstain: true,
          questions: ['Czy?'],
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'Anuluj' })).toHaveAttribute(
      'href',
      '/admin/votings/v1'
    );
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ votingId: 'v1', title: 'Remont' })
    );
  });

  it('cancels a new voting back to the list', () => {
    render(<VotingForm initial={NEW_VOTING} hoas={HOAS} />);

    expect(screen.getByRole('link', { name: 'Anuluj' })).toHaveAttribute(
      'href',
      '/admin/votings'
    );
  });

  it('adds, moves and removes questions with the buttons', async () => {
    const user = userEvent.setup();
    render(<VotingForm initial={NEW_VOTING} hoas={HOAS} />);

    await user.type(
      screen.getByRole('textbox', { name: 'Treść pytania 1' }),
      'A'
    );
    await user.click(screen.getByRole('button', { name: 'Dodaj pytanie' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Treść pytania 2' }),
      'B'
    );
    await user.click(
      screen.getByRole('button', { name: 'Przesuń pytanie 2 w górę' })
    );

    expect(
      screen.getByRole('textbox', { name: 'Treść pytania 1' })
    ).toHaveValue('B');

    await user.click(screen.getByRole('button', { name: 'Usuń pytanie 1' }));

    expect(
      screen.getAllByRole('textbox', { name: /Treść pytania/ })
    ).toHaveLength(1);
    expect(
      screen.getByRole('textbox', { name: 'Treść pytania 1' })
    ).toHaveValue('A');
  });
});
