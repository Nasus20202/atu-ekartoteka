import { beforeEach, describe, expect, it, vi } from 'vitest';

import { changeVotingStatus } from '@/lib/voting/mutations/change-voting-status';
import { createVoting } from '@/lib/voting/mutations/create-voting';
import { deleteDraftVoting } from '@/lib/voting/mutations/delete-draft-voting';
import { deleteExpiredVoteConfirmations } from '@/lib/voting/mutations/delete-expired-vote-confirmations';
import { saveVoteConfirmation } from '@/lib/voting/mutations/save-vote-confirmation';
import { updateDraftVoting } from '@/lib/voting/mutations/update-draft-voting';
import {
  deleteVoteConfirmation,
  registerConfirmationAttempt,
} from '@/lib/voting/mutations/vote-confirmation-attempts';

const db = vi.hoisted(() => {
  const tx = {
    voting: { updateMany: vi.fn() },
    votingQuestion: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  return {
    tx,
    voting: { create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    votingConfirmation: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      updateManyAndReturn: vi.fn(),
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
  questions: [{ text: 'A' }, { text: 'B' }],
};

describe('voting mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((run) =>
      typeof run === 'function' ? run(db.tx) : Promise.all(run)
    );
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

  it('replaces the questions of a draft', async () => {
    db.tx.voting.updateMany.mockResolvedValue({ count: 1 });

    expect(await updateDraftVoting('v1', INPUT)).toBe(true);
    expect(db.tx.voting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'v1', status: 'DRAFT' } })
    );
    expect(db.tx.votingQuestion.deleteMany).toHaveBeenCalledWith({
      where: { votingId: 'v1' },
    });
    expect(db.tx.votingQuestion.createMany).toHaveBeenCalledWith({
      data: [
        { votingId: 'v1', position: 0, text: 'A' },
        { votingId: 'v1', position: 1, text: 'B' },
      ],
    });
  });

  it('leaves the questions alone when the voting is no longer a draft', async () => {
    db.tx.voting.updateMany.mockResolvedValue({ count: 0 });

    expect(await updateDraftVoting('v1', INPUT)).toBe(false);
    expect(db.tx.votingQuestion.deleteMany).not.toHaveBeenCalled();
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
    await saveVoteConfirmation({
      id: 'c1',
      votingId: 'v1',
      userId: 'user-1',
      codeHash: 'h',
      answers: { q1: 'FOR' },
      expiresAt: new Date(),
    });

    expect(db.votingConfirmation.deleteMany).toHaveBeenCalledWith({
      where: { votingId: 'v1', userId: 'user-1' },
    });
    expect(db.votingConfirmation.create).toHaveBeenCalled();
  });

  it('counts an attempt atomically and reports the new total', async () => {
    db.votingConfirmation.updateManyAndReturn.mockResolvedValueOnce([
      { attempts: 3 },
    ]);
    db.votingConfirmation.updateManyAndReturn.mockResolvedValueOnce([]);

    expect(await registerConfirmationAttempt('c1')).toBe(3);
    expect(await registerConfirmationAttempt('gone')).toBeNull();
    expect(db.votingConfirmation.updateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: { attempts: { increment: 1 } },
      })
    );
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
