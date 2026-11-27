import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotifyVotersDialog } from '@/components/votings/notify-voters-dialog';

const mocks = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@/actions/voting/admin-votings', () => ({
  notifyVotersAction: mocks.notify,
}));

const VOTERS = [
  {
    id: 'u1',
    name: 'Anna',
    email: 'a@example.com',
    apartments: [{ id: 'a1', label: 'Lipowa 1/1 – Anna' }],
    hasVoted: true,
  },
  {
    id: 'u2',
    name: 'Jan',
    email: 'j@example.com',
    apartments: [
      { id: 'a2', label: 'Lipowa 1/2 – Jan i Ewa' },
      { id: 'a3', label: 'Lipowa 1/3 – Jan' },
    ],
    hasVoted: false,
  },
];

async function open(voters = VOTERS) {
  const user = userEvent.setup();
  render(<NotifyVotersDialog votingId="v1" voters={voters} />);
  await user.click(
    screen.getByRole('button', { name: 'Powiadom użytkowników' })
  );
  return user;
}

describe('NotifyVotersDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notify.mockResolvedValue({ ok: true, data: { sent: 1, failed: 0 } });
  });

  it('preselects the owners without a vote and shows who voted', async () => {
    await open();

    expect(screen.getByRole('checkbox', { name: 'Jan' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Anna' })).not.toBeChecked();
    expect(screen.getByText('Zagłosował(a)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyślij (1)' })).toBeEnabled();
  });

  it('shows each apartment of an owner with the name it is owned under', async () => {
    await open();

    expect(screen.getByText('Lipowa 1/2 – Jan i Ewa')).toBeInTheDocument();
    expect(screen.getByText('Lipowa 1/3 – Jan')).toBeInTheDocument();
  });

  it('sends to the chosen owners and reports the result', async () => {
    const user = await open();
    await user.click(screen.getByRole('button', { name: 'Wszyscy' }));
    await user.click(screen.getByRole('button', { name: 'Wyślij (2)' }));

    expect(mocks.notify).toHaveBeenCalledWith({
      votingId: 'v1',
      userIds: ['u1', 'u2'],
    });
    expect(await screen.findByText('Wysłano: 1')).toBeVisible();
  });

  it('mentions owners the email could not reach', async () => {
    mocks.notify.mockResolvedValue({ ok: true, data: { sent: 1, failed: 2 } });
    const user = await open();

    await user.click(screen.getByRole('button', { name: 'Wyślij (1)' }));

    expect(
      await screen.findByText('Wysłano: 1, nie udało się: 2')
    ).toBeVisible();
  });

  it('shows the refusal reason', async () => {
    mocks.notify.mockResolvedValue({
      ok: false,
      error: 'Głosowanie nie jest aktywne',
    });
    const user = await open();

    await user.click(screen.getByRole('button', { name: 'Wyślij (1)' }));

    expect(
      await screen.findByText('Głosowanie nie jest aktywne')
    ).toBeVisible();
  });

  it('selects only those without a vote again and allows deselecting all', async () => {
    const user = await open();
    await user.click(screen.getByRole('button', { name: 'Wszyscy' }));
    await user.click(screen.getByRole('button', { name: 'Bez głosu' }));

    expect(screen.getByRole('checkbox', { name: 'Anna' })).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Jan' }));
    expect(screen.getByRole('button', { name: 'Wyślij (0)' })).toBeDisabled();
  });

  it('explains when there is nobody to notify', async () => {
    await open([]);

    expect(
      screen.getByText(/Brak zatwierdzonych właścicieli/)
    ).toBeInTheDocument();
  });
});
