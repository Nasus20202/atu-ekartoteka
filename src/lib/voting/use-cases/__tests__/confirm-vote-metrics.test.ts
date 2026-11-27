import { beforeEach, describe, expect, it } from 'vitest';

import {
  mocks,
  pending,
  primeConfirmVoteMocks,
  TOKEN,
} from '@/__tests__/helpers/voting/confirm-vote-mocks';
import { confirmVote } from '@/lib/voting/use-cases/confirm-vote';

describe('confirmVote', () => {
  beforeEach(() => {
    primeConfirmVoteMocks();
  });

  describe('confirmation metrics', () => {
    it('counts a confirmed link with the ballots it stored', async () => {
      await confirmVote('user-1', TOKEN);

      expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
        result: 'confirmed',
      });
      expect(mocks.metrics.recordBallots).toHaveBeenCalledWith(2);
    });

    it('counts a link that is not in the expected format as invalid', async () => {
      await confirmVote('user-1', '123456');

      expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason: 'invalid_link',
      });
    });

    it('counts an unknown link as invalid', async () => {
      mocks.findByToken.mockResolvedValue(null);
      await confirmVote('user-1', TOKEN);

      expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason: 'invalid_link',
      });
    });

    it("counts another user's link as foreign", async () => {
      mocks.findByToken.mockResolvedValue(pending({ userId: 'user-2' }));
      await confirmVote('user-1', TOKEN);

      expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason: 'foreign_link',
      });
    });

    it('counts an expired link as expired', async () => {
      mocks.findByToken.mockResolvedValue(
        pending({ expiresAt: new Date(Date.now() - 1) })
      );
      await confirmVote('user-1', TOKEN);

      expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason: 'expired',
      });
    });

    it.each(['closed', 'not-found'])(
      'counts a voting refused with %s access as closed',
      async (denial) => {
        mocks.resolveOpenVoting.mockResolvedValue({
          failure: { ok: false, code: 'invalid', message: 'x' },
          denial,
        });
        await confirmVote('user-1', TOKEN);

        expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
          result: 'rejected',
          reason: 'closed',
        });
      }
    );

    it('does not count an account without access to votings', async () => {
      mocks.resolveOpenVoting.mockResolvedValue({
        failure: { ok: false, code: 'invalid', message: 'x' },
        denial: 'no-access',
      });
      await confirmVote('user-1', TOKEN);

      expect(mocks.metrics.recordConfirmation).not.toHaveBeenCalled();
    });

    it('counts a stored ballot that no longer fits as invalid', async () => {
      mocks.findByToken.mockResolvedValue(
        pending({ answers: { 'apt-1': { other: 'FOR' } } })
      );
      await confirmVote('user-1', TOKEN);

      expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason: 'invalid_link',
      });
    });

    it.each([
      ['closed', 'closed'],
      ['consumed', 'invalid_link'],
      ['nothing-to-vote', 'already_voted'],
      ['duplicate', 'already_voted'],
    ])(
      'counts a cast refused as %s with the reason %s',
      async (reason, expected) => {
        mocks.castBallots.mockResolvedValue({ ok: false, reason });
        await confirmVote('user-1', TOKEN);

        expect(mocks.metrics.recordConfirmation).toHaveBeenCalledWith({
          result: 'rejected',
          reason: expected,
        });
        expect(mocks.metrics.recordBallots).not.toHaveBeenCalled();
      }
    );
  });
});
