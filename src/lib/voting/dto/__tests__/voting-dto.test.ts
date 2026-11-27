import { describe, expect, it } from 'vitest';

import {
  toQuestionResults,
  toTenantVotingDto,
  toVoterDto,
} from '@/lib/voting/dto/voting-dto';
import { VoteChoice, VotingStatus } from '@/lib/voting/types/voting';

const questions = [
  { id: 'q1', position: 0, text: 'Pierwsze' },
  { id: 'q2', position: 1, text: 'Drugie' },
];

describe('toQuestionResults', () => {
  it('folds grouped counts per question and totals them', () => {
    const results = toQuestionResults(questions, [
      { questionId: 'q1', choice: VoteChoice.FOR, count: 3 },
      { questionId: 'q1', choice: VoteChoice.AGAINST, count: 1 },
      { questionId: 'q2', choice: VoteChoice.ABSTAIN, count: 2 },
    ]);

    expect(results).toEqual([
      {
        questionId: 'q1',
        text: 'Pierwsze',
        counts: { FOR: 3, AGAINST: 1, ABSTAIN: 0 },
        total: 4,
      },
      {
        questionId: 'q2',
        text: 'Drugie',
        counts: { FOR: 0, AGAINST: 0, ABSTAIN: 2 },
        total: 2,
      },
    ]);
  });

  it('reports zeros when nobody voted', () => {
    expect(toQuestionResults(questions, [])[0]).toMatchObject({ total: 0 });
  });
});

describe('toVoterDto', () => {
  it('falls back to the email when the voter has no name', () => {
    const dto = toVoterDto({
      id: 'b1',
      createdAt: new Date('2026-06-01T12:00:00Z'),
      user: { name: null, email: 'a@example.com' },
      apartment: { address: 'Lipowa', building: '1', number: '2' },
      votes: [{ questionId: 'q1', choice: VoteChoice.FOR }],
    });

    expect(dto).toMatchObject({
      voterName: 'a@example.com',
      answers: { q1: 'FOR' },
      votedAt: '2026-06-01T12:00:00.000Z',
    });
  });
});

describe('toTenantVotingDto', () => {
  const now = new Date('2026-06-01T12:00:00Z');
  const base = {
    id: 'v1',
    title: 'T',
    status: VotingStatus.ACTIVE,
    endsAt: null,
    hoa: { name: 'Wspólnota', _count: { apartments: 2 } },
    _count: { questions: 3, ballots: 1 },
  };

  it('waits for a vote while an apartment has not voted', () => {
    expect(toTenantVotingDto(base, now).awaitingVote).toBe(true);
  });

  it('stops waiting once every apartment has voted', () => {
    const voted = { ...base, _count: { questions: 3, ballots: 2 } };

    expect(toTenantVotingDto(voted, now).awaitingVote).toBe(false);
  });

  it('does not wait after the deadline or once results are published', () => {
    const late = { ...base, endsAt: new Date('2026-05-01T00:00:00Z') };
    const published = { ...base, status: VotingStatus.RESULTS_PUBLISHED };

    expect(toTenantVotingDto(late, now).awaitingVote).toBe(false);
    expect(toTenantVotingDto(published, now).awaitingVote).toBe(false);
  });
});
