import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '@/generated/prisma/client';
import { addMeetingBallot } from '@/lib/voting/mutations/add-meeting-ballot';
import { deleteMeetingBallot } from '@/lib/voting/mutations/delete-meeting-ballot';

const db = vi.hoisted(() => ({
  voting: { updateMany: vi.fn() },
  apartment: { findFirst: vi.fn() },
  votingBallot: { create: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

const READ_AT = new Date('2026-06-01T10:00:00Z');
const INPUT = {
  votingId: 'v1',
  readAt: READ_AT,
  hoaId: 'h1',
  apartmentId: 'a1',
  answers: { q1: 'FOR' as const },
};

describe('meeting ballot mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((run) => run(db));
    db.voting.updateMany.mockResolvedValue({ count: 1 });
    db.apartment.findFirst.mockResolvedValue({ id: 'a1' });
    db.votingBallot.create.mockResolvedValue({ id: 'b1' });
  });

  it('stores a ballot without a user in the unchanged draft', async () => {
    expect(await addMeetingBallot(INPUT)).toEqual({
      ok: true,
      ballotId: 'b1',
    });
    expect(db.voting.updateMany.mock.calls[0][0].where).toEqual({
      id: 'v1',
      status: 'DRAFT',
      updatedAt: READ_AT,
    });
    expect(db.apartment.findFirst.mock.calls[0][0].where).toEqual({
      id: 'a1',
      homeownersAssociationId: 'h1',
      isActive: true,
    });
    expect(db.votingBallot.create.mock.calls[0][0].data).toEqual({
      votingId: 'v1',
      apartmentId: 'a1',
      votes: { create: [{ questionId: 'q1', choice: 'FOR' }] },
    });
  });

  it('refuses when the draft changed meanwhile', async () => {
    db.voting.updateMany.mockResolvedValue({ count: 0 });

    expect(await addMeetingBallot(INPUT)).toEqual({
      ok: false,
      reason: 'changed',
    });
    expect(db.votingBallot.create).not.toHaveBeenCalled();
  });

  it('refuses an apartment outside the association', async () => {
    db.apartment.findFirst.mockResolvedValue(null);

    expect(await addMeetingBallot(INPUT)).toEqual({
      ok: false,
      reason: 'unknown-apartment',
    });
    expect(db.votingBallot.create).not.toHaveBeenCalled();
  });

  it('reports a second ballot of an apartment', async () => {
    db.votingBallot.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'x',
      })
    );

    expect(await addMeetingBallot(INPUT)).toEqual({
      ok: false,
      reason: 'duplicate',
    });
  });

  it('passes other failures on', async () => {
    db.votingBallot.create.mockRejectedValue(new Error('down'));

    await expect(addMeetingBallot(INPUT)).rejects.toThrow('down');
  });

  it.each([
    [1, true],
    [0, false],
  ])('removes only a meeting ballot of a draft: %i', async (count, removed) => {
    db.votingBallot.deleteMany.mockResolvedValue({ count });

    expect(await deleteMeetingBallot('v1', 'b1')).toBe(removed);
    expect(db.votingBallot.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'b1',
        votingId: 'v1',
        userId: null,
        voting: { status: 'DRAFT' },
      },
    });
  });
});
