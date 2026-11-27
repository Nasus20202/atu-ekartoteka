import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  changeVotingStatusAction,
  createVotingAction,
  deleteVotingAction,
  notifyVotersAction,
  updateVotingAction,
} from '@/actions/voting/admin-votings';

const mocks = vi.hoisted(() => ({
  requireAdminAction: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  changeStatus: vi.fn(),
  remove: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-action', () => ({
  requireAdminAction: mocks.requireAdminAction,
}));
vi.mock('@/lib/voting/use-cases/manage-voting', () => ({
  createVotingUseCase: mocks.create,
  updateVotingUseCase: mocks.update,
  changeVotingStatusUseCase: mocks.changeStatus,
  deleteVotingUseCase: mocks.remove,
}));
vi.mock('@/lib/voting/use-cases/notify-voters', () => ({
  notifyVoters: mocks.notify,
}));

const DENIED = {
  ok: false,
  error: 'Brak dostępu',
  code: 'forbidden',
} as const;

describe('admin voting actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAction.mockResolvedValue({
      session: { user: { id: 'admin-1' } },
    });
  });

  it('runs the use case as the admin from the session', async () => {
    mocks.create.mockResolvedValue({ ok: true, data: { id: 'v1' } });

    const result = await createVotingAction({ title: 'T' });

    expect(result).toEqual({ ok: true, data: { id: 'v1' } });
    expect(mocks.create).toHaveBeenCalledWith('admin-1', { title: 'T' });
  });

  it('splits the voting id from the fields on update', async () => {
    mocks.update.mockResolvedValue({ ok: true, data: { id: 'v1' } });

    await updateVotingAction({ votingId: 'v1', title: 'T' });

    expect(mocks.update).toHaveBeenCalledWith('admin-1', 'v1', { title: 'T' });
  });

  it('maps a use case failure to an action failure', async () => {
    mocks.changeStatus.mockResolvedValue({
      ok: false,
      code: 'invalid',
      message: 'Nie można',
    });

    expect(
      await changeVotingStatusAction({ votingId: 'v1', status: 'ACTIVE' })
    ).toEqual({ ok: false, error: 'Nie można', code: 'invalid' });
  });

  it.each([
    ['create', () => createVotingAction({}), mocks.create],
    ['update', () => updateVotingAction({}), mocks.update],
    ['status', () => changeVotingStatusAction({}), mocks.changeStatus],
    ['delete', () => deleteVotingAction({}), mocks.remove],
    ['notify', () => notifyVotersAction({}), mocks.notify],
  ])(
    'denies a non-admin on %s before doing anything',
    async (_n, call, useCase) => {
      mocks.requireAdminAction.mockResolvedValue({ denied: DENIED });

      expect(await call()).toBe(DENIED);
      expect(useCase).not.toHaveBeenCalled();
    }
  );

  it('survives a non-object input', async () => {
    mocks.notify.mockResolvedValue({
      ok: false,
      code: 'invalid',
      message: 'x',
    });

    await notifyVotersAction('nope');

    expect(mocks.notify).toHaveBeenCalledWith('admin-1', undefined, undefined);
  });
});
