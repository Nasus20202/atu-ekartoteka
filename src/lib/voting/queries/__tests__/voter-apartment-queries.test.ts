import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  countVoterApartments,
  findOwnBallots,
  findOwnedApartments,
  findVotableApartments,
} from '@/lib/voting/queries/find-voter-apartments';

const db = vi.hoisted(() => ({
  apartment: { findMany: vi.fn(), count: vi.fn() },
  votingBallot: { findMany: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

describe('voter apartment queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts the voter's active apartments in the HOA", async () => {
    db.apartment.count.mockResolvedValue(2);

    expect(await countVoterApartments('user-1', 'hoa-1')).toBe(2);
    expect(db.apartment.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        homeownersAssociationId: 'hoa-1',
        isActive: true,
      },
    });
  });

  it('lets the database pick the apartments that have not voted', async () => {
    await findVotableApartments('user-1', 'hoa-1', 'v1');

    expect(db.apartment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          votingBallots: { none: { votingId: 'v1' } },
        }),
      })
    );
  });

  it('keeps only own apartments among the given ids', async () => {
    await findOwnedApartments('user-1', 'hoa-1', ['a1']);

    expect(db.apartment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          homeownersAssociationId: 'hoa-1',
          isActive: true,
          id: { in: ['a1'] },
        },
      })
    );
  });

  it("reads the voter's ballots and those entered for their apartments", async () => {
    await findOwnBallots('user-1', 'v1');

    expect(db.votingBallot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          votingId: 'v1',
          OR: [
            { userId: 'user-1' },
            {
              userId: null,
              apartment: { userId: 'user-1', isActive: true },
            },
          ],
        },
      })
    );
  });
});
