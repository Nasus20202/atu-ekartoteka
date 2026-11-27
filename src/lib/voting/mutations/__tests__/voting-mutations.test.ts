import { beforeEach, describe, expect, it, vi } from 'vitest';

import { changeVotingStatus } from '@/lib/voting/mutations/change-voting-status';
import { createVoting } from '@/lib/voting/mutations/create-voting';
import { deleteDraftVoting } from '@/lib/voting/mutations/delete-draft-voting';
import { deleteExpiredVoteConfirmations } from '@/lib/voting/mutations/delete-expired-vote-confirmations';
import { deleteVoteConfirmation } from '@/lib/voting/mutations/delete-vote-confirmation';
import { saveVoteConfirmation } from '@/lib/voting/mutations/save-vote-confirmation';

const db = vi.hoisted(() => {
  return {
    voting: { create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    votingConfirmation: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
});

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

const INPUT = {
  hoaId: 'hoa-1',
  title: 'Remont',
  description: null,
  endsAt: null,
  allowAbstain: true,
  questions: [{ text: 'A' }, { text: 'B' }],
};

describe('voting mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((run) => Promise.all(run));
  });

  it('creates a voting with its questions in order', async () => {
    db.voting.create.mockResolvedValue({ id: 'v1' });

    expect(await createVoting(INPUT)).toEqual({ id: 'v1' });
    expect(db.voting.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hoaId: 'hoa-1',
          questions: {
            create: [
              { position: 0, text: 'A' },
              { position: 1, text: 'B' },
            ],
          },
        }),
      })
    );
  });

  it('moves the status only from the expected one', async () => {
    db.voting.updateMany.mockResolvedValueOnce({ count: 1 });
    db.voting.updateMany.mockResolvedValueOnce({ count: 0 });

    expect(await changeVotingStatus('v1', 'DRAFT', 'ACTIVE')).toBe(true);
    expect(await changeVotingStatus('v1', 'DRAFT', 'ACTIVE')).toBe(false);
    expect(db.voting.updateMany).toHaveBeenCalledWith({
      where: { id: 'v1', status: 'DRAFT' },
      data: { status: 'ACTIVE' },
    });
  });

  it('deletes only drafts', async () => {
    db.voting.deleteMany.mockResolvedValue({ count: 1 });

    expect(await deleteDraftVoting('v1')).toBe(true);
    expect(db.voting.deleteMany).toHaveBeenCalledWith({
      where: { id: 'v1', status: 'DRAFT' },
    });
  });

  it('replaces the pending confirmation of the user for the voting', async () => {
    db.votingConfirmation.create.mockResolvedValueOnce({ id: 'c1' });

    const id = await saveVoteConfirmation({
      votingId: 'v1',
      userId: 'user-1',
      tokenHash: 'h',
      answers: { a1: { q1: 'FOR' } },
      expiresAt: new Date(),
    });

    expect(id).toBe('c1');
    expect(db.votingConfirmation.deleteMany).toHaveBeenCalledWith({
      where: { votingId: 'v1', userId: 'user-1' },
    });
    expect(db.votingConfirmation.create).toHaveBeenCalled();
  });

  it('deletes a confirmation and the expired ones', async () => {
    await deleteVoteConfirmation('c1');
    await deleteExpiredVoteConfirmations();

    expect(db.votingConfirmation.deleteMany).toHaveBeenCalledWith({
      where: { id: 'c1' },
    });
    expect(db.votingConfirmation.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });
});
