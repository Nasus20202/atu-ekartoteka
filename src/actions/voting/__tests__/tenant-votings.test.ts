import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  confirmVoteAction,
  requestVoteConfirmationAction,
} from '@/actions/voting/tenant-votings';

const mocks = vi.hoisted(() => ({
  requireUserAction: vi.fn(),
  request: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-action', () => ({
  requireUserAction: mocks.requireUserAction,
}));
vi.mock('@/lib/voting/use-cases/request-vote-confirmation', () => ({
  requestVoteConfirmation: mocks.request,
}));
vi.mock('@/lib/voting/use-cases/confirm-vote', () => ({
  confirmVote: mocks.confirm,
}));

describe('tenant voting actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserAction.mockResolvedValue({
      session: { user: { id: 'user-1' } },
    });
  });

  it('takes the voter from the session, never from the input', async () => {
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });

    await requestVoteConfirmationAction({
      votingId: 'v1',
      answers: { q1: 'FOR' },
      userId: 'someone-else',
    });

    expect(mocks.request).toHaveBeenCalledWith('user-1', 'v1', { q1: 'FOR' });
  });

  it('passes the token to the use case with the voter from the session', async () => {
    mocks.confirm.mockResolvedValue({
      ok: true,
      data: { ballots: 1, votingId: 'v1' },
    });

    expect(
      await confirmVoteAction({ token: 'abc', userId: 'someone-else' })
    ).toEqual({ ok: true, data: { ballots: 1, votingId: 'v1' } });
    expect(mocks.confirm).toHaveBeenCalledWith('user-1', 'abc');
  });

  it('denies an anonymous caller', async () => {
    const denied = { ok: false, error: 'Zaloguj się', code: 'unauthenticated' };
    mocks.requireUserAction.mockResolvedValue({ denied });

    expect(await confirmVoteAction({})).toBe(denied);
    expect(await requestVoteConfirmationAction({})).toBe(denied);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
