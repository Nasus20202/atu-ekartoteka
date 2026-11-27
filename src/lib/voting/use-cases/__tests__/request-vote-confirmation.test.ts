import { beforeEach, describe, expect, it } from 'vitest';

import {
  ANSWERS,
  mocks,
  primeRequestMocks,
  VOTING,
} from '@/__tests__/helpers/voting/request-confirmation-mocks';
import { hashConfirmationToken } from '@/lib/voting/rules/confirmation-token';
import { requestVoteConfirmation } from '@/lib/voting/use-cases/request-vote-confirmation';

describe('requestVoteConfirmation', () => {
  beforeEach(primeRequestMocks);

  it('stores a hashed token with the answers and emails the plain token', async () => {
    const result = await requestVoteConfirmation('user-1', 'v1', ANSWERS);

    expect(result).toMatchObject({ ok: true });
    const saved = mocks.saveVoteConfirmation.mock.calls[0][0];
    const [, token] = mocks.send.mock.calls[0];
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(saved).toMatchObject({
      votingId: 'v1',
      userId: 'user-1',
      answers: ANSWERS,
      tokenHash: hashConfirmationToken(token),
    });
    expect(saved.tokenHash).not.toContain(token);
    expect(mocks.send.mock.calls[0][0]).toBe('jan@example.com');
  });

  it('passes through the reason a tenant cannot vote', async () => {
    const failure = { ok: false, code: 'not-found', message: 'x' };
    mocks.resolveOpenVoting.mockResolvedValue({ failure });

    expect(await requestVoteConfirmation('user-1', 'v1', ANSWERS)).toBe(
      failure
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('rejects incomplete answers before sending anything', async () => {
    expect(
      await requestVoteConfirmation('user-1', 'v1', {
        'apt-1': { q1: 'FOR' },
      })
    ).toMatchObject({
      ok: false,
      message: 'Odpowiedz na wszystkie pytania',
    });
    expect(mocks.saveVoteConfirmation).not.toHaveBeenCalled();
  });

  it('rejects abstaining in a voting that blocks it', async () => {
    mocks.resolveOpenVoting.mockResolvedValue({
      voting: { ...VOTING.voting, allowAbstain: false },
    });

    expect(
      await requestVoteConfirmation('user-1', 'v1', {
        'apt-1': { q1: 'FOR', q2: 'ABSTAIN' },
      })
    ).toMatchObject({ ok: false });
    expect(mocks.saveVoteConfirmation).not.toHaveBeenCalled();
  });

  it('rejects a user whose apartments have all voted', async () => {
    mocks.findVotableApartments.mockResolvedValue([]);

    expect(
      await requestVoteConfirmation('user-1', 'v1', ANSWERS)
    ).toMatchObject({
      ok: false,
      code: 'invalid',
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('refuses a new link within the rate limit window and says how long to wait', async () => {
    mocks.findRecent.mockResolvedValue({
      createdAt: new Date(Date.now() - 60_000),
    });

    expect(await requestVoteConfirmation('user-1', 'v1', ANSWERS)).toEqual({
      ok: false,
      code: 'invalid',
      message: 'Poczekaj 4 min przed ponownym wysłaniem linku',
    });
    expect(mocks.saveVoteConfirmation).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('counts a requested link', async () => {
    await requestVoteConfirmation('user-1', 'v1', ANSWERS);

    expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
      result: 'requested',
    });
  });

  it('counts a link refused by the rate limit', async () => {
    mocks.findRecent.mockResolvedValue({ createdAt: new Date() });
    await requestVoteConfirmation('user-1', 'v1', ANSWERS);

    expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
      result: 'rate_limited',
    });
  });

  it('removes the pending ballot when the email cannot be sent', async () => {
    mocks.send.mockResolvedValue({ ok: false, reason: 'send-failed' });

    expect(
      await requestVoteConfirmation('user-1', 'v1', ANSWERS)
    ).toMatchObject({
      ok: false,
      code: 'failed',
    });
    expect(mocks.deleteVoteConfirmation).toHaveBeenCalledWith('c1');
  });

  it('counts a link whose email could not be sent', async () => {
    mocks.send.mockResolvedValue({ ok: false, reason: 'send-failed' });
    await requestVoteConfirmation('user-1', 'v1', ANSWERS);

    expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
      result: 'email_failed',
    });
    expect(mocks.metrics.recordConfirmation).not.toHaveBeenCalledWith({
      result: 'requested',
    });
  });
});
