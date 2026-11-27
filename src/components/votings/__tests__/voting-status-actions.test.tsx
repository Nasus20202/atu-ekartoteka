import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VotingStatusActions } from '@/components/votings/voting-status-actions';

const mocks = vi.hoisted(() => ({
  changeStatus: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/actions/voting/admin-votings', () => ({
  changeVotingStatusAction: mocks.changeStatus,
  deleteVotingAction: mocks.remove,
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

describe('VotingStatusActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
    mocks.changeStatus.mockResolvedValue({
      ok: true,
      data: { status: 'ACTIVE' },
    });
    mocks.remove.mockResolvedValue({ ok: true, data: { id: 'v1' } });
  });

  it('offers publish, edit and delete for a draft', () => {
    render(<VotingStatusActions votingId="v1" status="DRAFT" />);

    expect(
      screen.getByRole('button', { name: 'Opublikuj' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edytuj' })).toHaveAttribute(
      'href',
      '/admin/votings/v1/edit'
    );
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeInTheDocument();
  });

  it('offers neither edit nor delete once published', () => {
    render(<VotingStatusActions votingId="v1" status="ACTIVE" />);

    expect(
      screen.queryByRole('link', { name: 'Edytuj' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Usuń' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Pokaż wyniki' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zarchiwizuj' })
    ).toBeInTheDocument();
  });

  it('offers nothing for an archived voting', () => {
    render(<VotingStatusActions votingId="v1" status="ARCHIVED" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('publishes only after the admin confirms', async () => {
    const user = userEvent.setup();
    render(<VotingStatusActions votingId="v1" status="DRAFT" />);

    mocks.confirm.mockResolvedValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Opublikuj' }));
    expect(mocks.changeStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Opublikuj' }));
    expect(mocks.changeStatus).toHaveBeenCalledWith({
      votingId: 'v1',
      status: 'ACTIVE',
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('returns to the list after deleting a draft', async () => {
    const user = userEvent.setup();
    render(<VotingStatusActions votingId="v1" status="DRAFT" />);

    await user.click(screen.getByRole('button', { name: 'Usuń' }));

    expect(mocks.remove).toHaveBeenCalledWith({ votingId: 'v1' });
    expect(mocks.push).toHaveBeenCalledWith('/admin/votings');
  });

  it('shows a generic message when the request itself fails', async () => {
    mocks.changeStatus.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    render(<VotingStatusActions votingId="v1" status="DRAFT" />);

    await user.click(screen.getByRole('button', { name: 'Opublikuj' }));

    expect(
      await screen.findByText('Nie udało się wykonać operacji')
    ).toBeVisible();
  });

  it('archives a published voting after confirmation', async () => {
    const user = userEvent.setup();
    render(<VotingStatusActions votingId="v1" status="RESULTS_PUBLISHED" />);

    await user.click(screen.getByRole('button', { name: 'Zarchiwizuj' }));

    expect(mocks.changeStatus).toHaveBeenCalledWith({
      votingId: 'v1',
      status: 'ARCHIVED',
    });
  });

  it('shows why a change was refused', async () => {
    mocks.changeStatus.mockResolvedValue({
      ok: false,
      error: 'Termin już minął',
    });
    const user = userEvent.setup();
    render(<VotingStatusActions votingId="v1" status="DRAFT" />);

    await user.click(screen.getByRole('button', { name: 'Opublikuj' }));

    expect(await screen.findByText('Termin już minął')).toBeVisible();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
