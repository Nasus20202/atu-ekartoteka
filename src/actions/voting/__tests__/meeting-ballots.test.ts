import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addMeetingBallotAction,
  removeMeetingBallotAction,
} from '@/actions/voting/meeting-ballots';

const mocks = vi.hoisted(() => ({
  requireAdminAction: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-action', () => ({
  requireAdminAction: mocks.requireAdminAction,
}));
vi.mock('@/lib/voting/use-cases/meeting-ballots', () => ({
  addMeetingBallotUseCase: mocks.add,
  removeMeetingBallotUseCase: mocks.remove,
}));

const DENIED = { ok: false, error: 'Brak dostępu', code: 'forbidden' };

describe('meeting ballot actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAction.mockResolvedValue({
      session: { user: { id: 'admin-1' } },
    });
    mocks.add.mockResolvedValue({ ok: true, data: { id: 'b1' } });
    mocks.remove.mockResolvedValue({ ok: true, data: { id: 'b1' } });
  });

  it.each([
    ['add', addMeetingBallotAction],
    ['remove', removeMeetingBallotAction],
  ])('%s does nothing for anyone but an admin', async (_, action) => {
    mocks.requireAdminAction.mockResolvedValue({ denied: DENIED });

    expect(await action({ votingId: 'v1' })).toBe(DENIED);
    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('passes the entered ballot to the use case', async () => {
    const answers = { q1: 'FOR' };

    expect(
      await addMeetingBallotAction({
        votingId: 'v1',
        apartmentId: 'a1',
        answers,
      })
    ).toEqual({ ok: true, data: { id: 'b1' } });
    expect(mocks.add).toHaveBeenCalledWith('admin-1', 'v1', 'a1', answers);
  });

  it('passes the removal to the use case', async () => {
    await removeMeetingBallotAction({ votingId: 'v1', ballotId: 'b1' });

    expect(mocks.remove).toHaveBeenCalledWith('admin-1', 'v1', 'b1');
  });
});
