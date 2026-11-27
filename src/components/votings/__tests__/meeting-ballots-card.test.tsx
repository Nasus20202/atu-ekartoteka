import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MeetingBallotsCard } from '@/components/votings/meeting-ballots-card';
import type { VoterDto } from '@/lib/voting/dto/voting-dto';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  refresh: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/actions/voting/meeting-ballots', () => ({
  addMeetingBallotAction: mocks.add,
  removeMeetingBallotAction: mocks.remove,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('@/components/votings/use-meeting-apartments', () => ({
  useMeetingApartments: () => ({
    search: '',
    setSearch: vi.fn(),
    options: [{ id: 'a1', label: 'Lipowa 1/2 – Anna' }],
    pending: false,
    failed: false,
    refresh: mocks.reload,
  }),
}));

const entered: VoterDto = {
  ballotId: 'b1',
  voterName: 'Jan',
  voterEmail: null,
  fromMeeting: true,
  apartment: { address: 'Lipowa', building: '1', number: '3' },
  votedAt: '2026-06-01T10:00:00.000Z',
  answers: { q1: 'AGAINST' },
};

const show = (ballots: VoterDto[] = []) =>
  render(
    <MeetingBallotsCard
      votingId="v1"
      questions={[{ id: 'q1', position: 0, text: 'Czy remont?' }]}
      choices={['FOR', 'AGAINST']}
      ballots={ballots}
    />
  );

const save = () => screen.getByRole('button', { name: 'Zapisz głos' });

async function fillIn() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Lokal' }));
  await user.click(screen.getByRole('option', { name: 'Lipowa 1/2 – Anna' }));
  await user.click(screen.getByRole('radio', { name: 'Za' }));
  return user;
}

describe('MeetingBallotsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.add.mockResolvedValue({ ok: true });
    mocks.remove.mockResolvedValue({ ok: true });
    mocks.confirm.mockResolvedValue(true);
  });

  it('waits for the apartment and every answer', async () => {
    show();
    expect(save()).toBeDisabled();
    expect(screen.getByText(/Nie wpisano jeszcze/)).toBeInTheDocument();

    await fillIn();

    expect(save()).toBeEnabled();
  });

  it('saves the ballot, clears the form and reads the lists again', async () => {
    show();
    const user = await fillIn();

    await user.click(save());

    expect(mocks.add).toHaveBeenCalledWith({
      votingId: 'v1',
      apartmentId: 'a1',
      answers: { q1: 'FOR' },
    });
    expect(mocks.reload).toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalled();
    expect(save()).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Za' })).not.toBeChecked();
  });

  it.each([
    [{ ok: false, error: 'Za ten lokal oddano już głos' }, /oddano już głos/],
    [{ ok: false }, /Nie udało się zapisać głosu/],
  ])('keeps the entry and says why it failed', async (result, message) => {
    mocks.add.mockResolvedValue(result);
    show();
    const user = await fillIn();

    await user.click(save());

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Za' })).toBeChecked();
  });

  it('reports a request that does not arrive', async () => {
    mocks.add.mockRejectedValue(new Error('offline'));
    show();
    const user = await fillIn();

    await user.click(save());

    expect(
      await screen.findByText('Nie udało się zapisać głosu')
    ).toBeVisible();
  });

  it.each([
    [true, 1],
    [false, 0],
  ])('removes a ballot only when confirmed: %s', async (confirmed, calls) => {
    mocks.confirm.mockResolvedValue(confirmed);
    const user = userEvent.setup();
    show([entered]);
    const list = screen.getByRole('list', { name: 'Wpisane głosy' });
    expect(within(list).getByText('1. Przeciw')).toBeInTheDocument();
    expect(screen.getByText('Wpisane głosy: 1')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Usuń głos za lokal Lipowa 1/3' })
    );

    expect(mocks.remove).toHaveBeenCalledTimes(calls);
  });

  it('animates the change of the list', () => {
    show([entered]);

    expect(
      screen.getByRole('list', { name: 'Wpisane głosy' }).parentElement
    ).toHaveClass('motion-safe:animate-view-switch');
  });
});
