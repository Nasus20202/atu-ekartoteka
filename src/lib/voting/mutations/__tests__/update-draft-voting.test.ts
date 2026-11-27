import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateDraftVoting } from '@/lib/voting/mutations/update-draft-voting';

const db = vi.hoisted(() => ({
  voting: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
  votingQuestion: { deleteMany: vi.fn(), createMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

const INPUT = {
  hoaId: 'hoa-1',
  title: 'Remont',
  description: null,
  endsAt: null,
  allowAbstain: true,
  questions: [{ text: 'A' }, { text: 'B' }],
};

const current = (ballots: number, questions = INPUT.questions) => ({
  hoaId: 'hoa-1',
  allowAbstain: true,
  questions,
  _count: { ballots },
});

describe('updateDraftVoting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((run) => run(db));
    db.voting.updateMany.mockResolvedValue({ count: 1 });
    db.voting.findUniqueOrThrow.mockResolvedValue(current(0));
  });

  it('locks the draft and replaces its questions', async () => {
    expect(await updateDraftVoting('v1', INPUT)).toBe('updated');
    expect(db.voting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'v1', status: 'DRAFT' } })
    );
    expect(db.voting.update.mock.calls[0][0].data).toMatchObject({
      title: 'Remont',
      allowAbstain: true,
    });
    expect(db.votingQuestion.createMany).toHaveBeenCalledWith({
      data: [
        { votingId: 'v1', position: 0, text: 'A' },
        { votingId: 'v1', position: 1, text: 'B' },
      ],
    });
  });

  it('changes nothing once the voting is no longer a draft', async () => {
    db.voting.updateMany.mockResolvedValue({ count: 0 });

    expect(await updateDraftVoting('v1', INPUT)).toBe('not-draft');
    expect(db.voting.update).not.toHaveBeenCalled();
    expect(db.votingQuestion.deleteMany).not.toHaveBeenCalled();
  });

  it('keeps the questions, and so the ballots, of a draft with ballots', async () => {
    db.voting.findUniqueOrThrow.mockResolvedValue(current(2));

    expect(await updateDraftVoting('v1', INPUT)).toBe('updated');
    expect(db.voting.update).toHaveBeenCalled();
    expect(db.votingQuestion.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses other questions while ballots are entered', async () => {
    db.voting.findUniqueOrThrow.mockResolvedValue(current(1, [{ text: 'A' }]));

    expect(await updateDraftVoting('v1', INPUT)).toBe('locked');
    expect(db.voting.update).not.toHaveBeenCalled();
    expect(db.votingQuestion.deleteMany).not.toHaveBeenCalled();
  });
});
