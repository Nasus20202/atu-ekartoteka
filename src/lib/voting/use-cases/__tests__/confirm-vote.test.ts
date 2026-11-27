import { beforeEach, describe, expect, it } from 'vitest';

import {
  ANSWERS,
  mocks,
  pending,
  primeConfirmVoteMocks,
  TOKEN,
} from '@/__tests__/helpers/voting/confirm-vote-mocks';
import { hashConfirmationToken } from '@/lib/voting/rules/confirmation-token';
import { confirmVote, LINK_INVALID } from '@/lib/voting/use-cases/confirm-vote';

describe('confirmVote', () => {
  beforeEach(() => {
    primeConfirmVoteMocks();
  });

  it('casts the ballots for the owner of the link', async () => {
    expect(await confirmVote('user-1', TOKEN)).toEqual({
      ok: true,
      data: { ballots: 2, votingId: 'v1' },
    });
    expect(mocks.findByToken).toHaveBeenCalledWith(
      hashConfirmationToken(TOKEN)
    );
    expect(mocks.castBallots).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmationId: 'c1',
        votingId: 'v1',
        hoaId: 'hoa-1',
        userId: 'user-1',
        answers: ANSWERS,
      })
    );
  });

  it('rejects a malformed token without touching the database', async () => {
    expect(await confirmVote('user-1', '123456')).toMatchObject({
      message: LINK_INVALID,
    });
    expect(await confirmVote('user-1', undefined)).toMatchObject({
      message: LINK_INVALID,
    });
    expect(mocks.findByToken).not.toHaveBeenCalled();
  });

  it('answers an unknown token like any other bad link', async () => {
    mocks.findByToken.mockResolvedValue(null);

    expect(await confirmVote('user-1', TOKEN)).toMatchObject({
      ok: false,
      message: LINK_INVALID,
    });
    expect(mocks.castBallots).not.toHaveBeenCalled();
  });

  it("refuses another user's link without revealing it and keeps it usable", async () => {
    mocks.findByToken.mockResolvedValue(pending({ userId: 'user-2' }));

    expect(await confirmVote('user-1', TOKEN)).toMatchObject({
      ok: false,
      message: LINK_INVALID,
    });
    expect(mocks.castBallots).not.toHaveBeenCalled();
    expect(mocks.deleteConfirmation).not.toHaveBeenCalled();
    expect(mocks.log.warn).toHaveBeenCalledWith(
      { userId: 'user-1', ownerId: 'user-2' },
      'Foreign vote link'
    );
  });

  it('rejects an expired link and removes it', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ expiresAt: new Date(Date.now() - 1) })
    );

    expect(await confirmVote('user-1', TOKEN)).toMatchObject({ ok: false });
    expect(mocks.deleteConfirmation).toHaveBeenCalledWith('c1');
    expect(mocks.castBallots).not.toHaveBeenCalled();
  });

  it('passes through a closed voting', async () => {
    const failure = {
      ok: false,
      code: 'invalid',
      message: 'Głosowanie zostało zakończone',
    };
    mocks.resolveOpenVoting.mockResolvedValue({ failure, denial: 'closed' });

    expect(await confirmVote('user-1', TOKEN)).toBe(failure);
    expect(mocks.resolveOpenVoting).toHaveBeenCalledWith(
      'user-1',
      'v1',
      expect.any(Date)
    );
  });

  it.each([
    ['closed', 'Głosowanie zostało zakończone'],
    ['consumed', LINK_INVALID],
    ['nothing-to-vote', 'Oddano już głosy za wszystkie Twoje lokale'],
  ])('maps the %s outcome of the transaction', async (reason, message) => {
    mocks.castBallots.mockResolvedValue({ ok: false, reason });

    expect(await confirmVote('user-1', TOKEN)).toMatchObject({
      ok: false,
      message,
    });
  });

  it('drops a stored ballot whose answers no longer fit the questions', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ answers: { 'apt-1': { other: 'FOR' } } })
    );

    expect(await confirmVote('user-1', TOKEN)).toMatchObject({ ok: false });
    expect(mocks.deleteConfirmation).toHaveBeenCalledWith('c1');
    expect(mocks.castBallots).not.toHaveBeenCalled();
  });

  it('reports a duplicate as a failure', async () => {
    mocks.castBallots.mockResolvedValue({ ok: false, reason: 'duplicate' });

    expect(await confirmVote('user-1', TOKEN)).toMatchObject({
      ok: false,
      code: 'failed',
    });
  });

  it('never logs the token or the answers', async () => {
    await confirmVote('user-1', TOKEN);
    mocks.findByToken.mockResolvedValue(pending({ userId: 'user-2' }));
    await confirmVote('user-1', TOKEN);

    const logged = JSON.stringify([
      ...mocks.log.info.mock.calls,
      ...mocks.log.warn.mock.calls,
    ]);
    expect(logged).not.toContain(TOKEN);
    expect(logged).not.toContain('FOR');
  });
});
