import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countAwaitingVotings } from '@/lib/voting/queries/count-awaiting-votings';
import { countVotingResults } from '@/lib/voting/queries/count-voting-results';
import { findAdminVotings } from '@/lib/voting/queries/find-admin-votings';
import {
  findEligibleRecipients,
  findEligibleVoters,
} from '@/lib/voting/queries/find-eligible-voters';
import { findRecentVoteConfirmation } from '@/lib/voting/queries/find-recent-vote-confirmation';
import {
  findTenantVoting,
  findTenantVotings,
} from '@/lib/voting/queries/find-tenant-votings';
import { findVoteConfirmation } from '@/lib/voting/queries/find-vote-confirmation';
import {
  findOwnBallot,
  findVotableApartmentIds,
  findVoterApartments,
} from '@/lib/voting/queries/find-voter-apartments';
import { findVotingBallots } from '@/lib/voting/queries/find-voting-ballots';
import { findVotingById } from '@/lib/voting/queries/find-voting-by-id';
import { hoaExists } from '@/lib/voting/queries/hoa-exists';

const db = vi.hoisted(() => ({
  voting: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  votingVote: { groupBy: vi.fn() },
  votingBallot: { findMany: vi.fn(), findFirst: vi.fn() },
  votingConfirmation: { findUnique: vi.fn(), findFirst: vi.fn() },
  user: { findMany: vi.fn() },
  apartment: { findMany: vi.fn() },
  homeownersAssociation: { count: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

describe('voting queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads a voting with its questions in order', async () => {
    db.voting.findUnique.mockResolvedValue({ id: 'v1' });

    expect(await findVotingById('v1')).toEqual({ id: 'v1' });
    expect(db.voting.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v1' },
        select: expect.objectContaining({
          questions: expect.objectContaining({ orderBy: { position: 'asc' } }),
        }),
      })
    );
  });

  it('lists votings newest first with counts', async () => {
    await findAdminVotings();

    expect(db.voting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 200,
      })
    );
  });

  it('counts every choice per question in the database', async () => {
    db.votingVote.groupBy.mockResolvedValue([
      { questionId: 'q1', choice: 'FOR', _count: { _all: 3 } },
    ]);

    expect(await countVotingResults('v1')).toEqual([
      { questionId: 'q1', choice: 'FOR', count: 3 },
    ]);
    expect(db.votingVote.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['questionId', 'choice'],
        where: { ballot: { votingId: 'v1' } },
      })
    );
  });

  it('lists the ballots of a voting with voter and apartment', async () => {
    await findVotingBallots('v1');

    expect(db.votingBallot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { votingId: 'v1' } })
    );
  });

  it('finds approved owners of active apartments of the HOA', async () => {
    await findEligibleVoters('hoa-1', 'v1');

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'APPROVED',
          apartments: {
            some: { homeownersAssociationId: 'hoa-1', isActive: true },
          },
        },
      })
    );
  });

  it('narrows recipients to eligible users among the requested ids', async () => {
    await findEligibleRecipients('hoa-1', ['u1', 'u2']);

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['u1', 'u2'] },
          status: 'APPROVED',
        }),
      })
    );
  });

  it('scopes tenant votings to visible statuses and the HOAs the user owns in', async () => {
    await findTenantVotings('user-1');

    expect(db.voting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ['ACTIVE', 'RESULTS_PUBLISHED'] },
          hoa: { apartments: { some: { userId: 'user-1', isActive: true } } },
        },
      })
    );
  });

  it('finds one tenant voting only inside the same scope', async () => {
    db.voting.findFirst.mockResolvedValue(null);

    expect(await findTenantVoting('user-1', 'v1')).toBeNull();
    expect(db.voting.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'v1',
          status: { in: ['ACTIVE', 'RESULTS_PUBLISHED'] },
          hoa: { apartments: { some: { userId: 'user-1', isActive: true } } },
        },
      })
    );
  });

  it('counts only open votings with an apartment that has not voted', async () => {
    const base = {
      status: 'ACTIVE',
      endsAt: null,
      hoa: { name: 'H', _count: { apartments: 2 } },
    };
    db.voting.findMany.mockResolvedValue([
      { ...base, id: 'a', _count: { questions: 1, ballots: 1 } },
      { ...base, id: 'b', _count: { questions: 1, ballots: 2 } },
      {
        ...base,
        id: 'c',
        _count: { questions: 1, ballots: 0 },
        endsAt: new Date(1),
      },
    ]);

    expect(await countAwaitingVotings('user-1', new Date())).toBe(1);
    expect(db.voting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['ACTIVE'] } }),
      })
    );
  });

  it('reads the pending confirmation of a user for a voting', async () => {
    await findVoteConfirmation('v1', 'user-1');

    expect(db.votingConfirmation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { votingId_userId: { votingId: 'v1', userId: 'user-1' } },
      })
    );
  });

  it('looks for a code issued in the last five minutes, for any voting', async () => {
    const now = new Date('2026-06-01T12:05:00Z');

    await findRecentVoteConfirmation('user-1', now);

    expect(db.votingConfirmation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          createdAt: { gt: new Date('2026-06-01T12:00:00Z') },
        },
      })
    );
  });

  it('lists the apartments of the voter with their ballot for the voting', async () => {
    await findVoterApartments('user-1', 'hoa-1', 'v1');

    expect(db.apartment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          homeownersAssociationId: 'hoa-1',
          isActive: true,
        },
      })
    );
  });

  it('returns only the ids of apartments that have not voted', async () => {
    db.apartment.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

    expect(await findVotableApartmentIds('user-1', 'hoa-1', 'v1')).toEqual([
      'a1',
      'a2',
    ]);
    expect(db.apartment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          votingBallots: { none: { votingId: 'v1' } },
        }),
      })
    );
  });

  it("reads the voter's own ballot only", async () => {
    await findOwnBallot('user-1', 'v1');

    expect(db.votingBallot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', votingId: 'v1' } })
    );
  });

  it('tells whether an HOA exists', async () => {
    db.homeownersAssociation.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    expect(await hoaExists('hoa-1')).toBe(true);
    expect(await hoaExists('nope')).toBe(false);
  });
});
