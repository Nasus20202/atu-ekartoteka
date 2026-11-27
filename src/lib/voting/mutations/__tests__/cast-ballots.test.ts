import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '@/generated/prisma/client';
import { castBallots } from '@/lib/voting/mutations/cast-ballots';

const mocks = vi.hoisted(() => {
  const tx = {
    voting: { findUnique: vi.fn() },
    votingConfirmation: { deleteMany: vi.fn() },
    apartment: { findMany: vi.fn() },
    votingBallot: { create: vi.fn() },
  };
  return { tx, transaction: vi.fn() };
});

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

const INPUT = {
  confirmationId: 'c1',
  votingId: 'v1',
  hoaId: 'hoa-1',
  userId: 'user-1',
  answers: { q1: 'FOR', q2: 'ABSTAIN' } as const,
  now: new Date('2026-06-01T12:00:00Z'),
};

describe('castBallots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((run) => run(mocks.tx));
    mocks.tx.voting.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      endsAt: null,
    });
    mocks.tx.votingConfirmation.deleteMany.mockResolvedValue({ count: 1 });
    mocks.tx.apartment.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
  });

  it('stores one ballot with every answer per apartment that has not voted', async () => {
    expect(await castBallots(INPUT)).toEqual({ ok: true, ballots: 2 });

    expect(mocks.tx.apartment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          votingBallots: { none: { votingId: 'v1' } },
        }),
      })
    );
    expect(mocks.tx.votingBallot.create).toHaveBeenCalledTimes(2);
    expect(mocks.tx.votingBallot.create).toHaveBeenCalledWith({
      data: {
        votingId: 'v1',
        userId: 'user-1',
        apartmentId: 'a1',
        votes: {
          create: [
            { questionId: 'q1', choice: 'FOR' },
            { questionId: 'q2', choice: 'ABSTAIN' },
          ],
        },
      },
    });
  });

  it('refuses after the voting closed, without consuming the code', async () => {
    mocks.tx.voting.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      endsAt: new Date('2026-05-01T00:00:00Z'),
    });

    expect(await castBallots(INPUT)).toEqual({ ok: false, reason: 'closed' });
    expect(mocks.tx.votingConfirmation.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses a confirmation that a concurrent request already consumed', async () => {
    mocks.tx.votingConfirmation.deleteMany.mockResolvedValue({ count: 0 });

    expect(await castBallots(INPUT)).toEqual({ ok: false, reason: 'consumed' });
    expect(mocks.tx.votingBallot.create).not.toHaveBeenCalled();
  });

  it('refuses when every apartment has voted', async () => {
    mocks.tx.apartment.findMany.mockResolvedValue([]);

    expect(await castBallots(INPUT)).toEqual({
      ok: false,
      reason: 'nothing-to-vote',
    });
  });

  it('turns a unique key violation into a duplicate outcome', async () => {
    mocks.tx.votingBallot.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    expect(await castBallots(INPUT)).toEqual({
      ok: false,
      reason: 'duplicate',
    });
  });

  it('rethrows any other error', async () => {
    mocks.tx.votingBallot.create.mockRejectedValue(new Error('boom'));

    await expect(castBallots(INPUT)).rejects.toThrow('boom');
  });
});
